import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RawDraftContentState } from 'draft-js';
import { MishnaRepository } from './mishna.repository';
import { HalachaOverrideRepository } from './halacha-override.repository';
import {
  HalachaOperation,
  HalachaOverride,
} from './schemas/halacha-override.schema';
import {
  SplitOperationDto,
  UnifyOperationDto,
  UpsertHalachaOverrideDto,
} from './dto/halacha-override.dto';
import { Mishna } from './schemas/mishna.schema';
import { Line, SubLine } from './models/line.model';
import { concatRichText } from './inc/draftjs-merge';
import { sliceRichText } from './inc/draftjs-slice';

/**
 * Result of resolving a halacha against a chapter's overrides.
 * `null` means "no transformation needed — caller should use the raw Mishna doc".
 */
export type ResolvedHalacha =
  | { kind: 'unified'; mishna: any; redirectTo?: string }
  | { kind: 'split'; mishna: any }
  | null;

/**
 * Reference shape used in the tractate doc's `chapters[].mishnaiot` array.
 * We add an optional `unifiedWith` field so the FE can render combined labels
 * like "\u05d5-\u05d6" without the BE knowing about Hebrew letters.
 */
export interface OverlaidMishnaRef {
  id: string;
  mishna: string;
  mishnaRef?: any;
  /** When set, this entry represents a unified halacha pair: this entry is the first
   *  source, and `unifiedWith` is the second source's id (e.g. '007'). */
  unifiedWith?: string;
}

/**
 * Information about one sugia inside a Halacha, used by the editor UI to choose
 * split boundaries and by validation to bound the boundary index.
 */
export interface SugiaInfo {
  /** Display name (the value of `sugiaName` on the first subline that introduces this sugia). */
  sugiaName: string;
  /** First subline index of the sugia (1-based, matches `SubLine.index`). */
  firstSublineIndex: number;
  /** `lineNumber` of the first line containing this sugia. */
  firstLineNumber: string;
  /** Position of the first line in the source's `lines` array (0-based). Used internally
   *  for line-range slicing during split composition. */
  firstLineIndex: number;
  /** Total number of lines in this sugia block. */
  lineCount: number;
}

/** Per-Halacha summary returned alongside the override doc to drive the admin UI. */
export interface HalachaStructure {
  /** Halacha id as stored on the source Mishna (zero-padded numeric). */
  source: string;
  /** Ordered sugias detected inside the Halacha. */
  sugias: SugiaInfo[];
  /** The Mishna's rich text — needed by the editor's "Mishna cut picker". */
  richTextMishna: RawDraftContentState | null;
}

/**
 * Mongoose docs hold their pojo state under `_doc`. When spreading we want the plain
 * object — without this helper, `{ ...mongooseDoc }` includes hidden internals and
 * misses some virtuals. Safe for already-plain objects (returns them unchanged).
 */
function unwrapMongoose<T = any>(doc: any): T {
  if (doc && typeof doc === 'object' && '_doc' in doc) {
    return { ...(doc as any)._doc } as T;
  }
  return { ...(doc ?? {}) } as T;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

@Injectable()
export class HalachaOverrideService {
  constructor(
    private readonly halachaOverrideRepository: HalachaOverrideRepository,
    private readonly mishnaRepository: MishnaRepository,
  ) {}

  // ============================================================
  // Read API
  // ============================================================

  /**
   * Returns the override doc (without composition). Composition will be layered
   * by the read path in Phase 2/3. Returns `null` if no overrides exist.
   */
  async getOverride(
    tractate: string,
    chapter: string,
  ): Promise<HalachaOverride | null> {
    return this.halachaOverrideRepository.findByChapter(tractate, chapter);
  }

  /**
   * Loads the chapter's source Halachas and returns a structural summary the editor
   * UI uses to pick split boundaries (sugia list + Mishna rich text per Halacha).
   */
  async getChapterStructure(
    tractate: string,
    chapter: string,
  ): Promise<HalachaStructure[]> {
    const mishnas = await this.mishnaRepository.getAllChapter(tractate, chapter);
    return mishnas.map((m) => ({
      source: m.mishna,
      sugias: this.extractSugias(m.lines ?? []),
      richTextMishna: m.richTextMishna ?? null,
    }));
  }

  // ============================================================
  // Write API
  // ============================================================

  /**
   * Validates and upserts the layout. The DTO has already passed structural validation
   * (shape, types, discriminator). Here we enforce semantic rules that need DB context:
   *   - sources exist in the chapter
   *   - each source halacha is referenced by at most one operation
   *   - unify: two distinct adjacent sources
   *   - split: enough sugias, boundaries in range and strictly increasing,
   *            mishnaCuts aligned and addressable inside `richTextMishna`
   */
  async upsertOverride(
    tractate: string,
    chapter: string,
    dto: UpsertHalachaOverrideDto,
    updatedBy?: string,
  ): Promise<HalachaOverride> {
    const mishnas = await this.mishnaRepository.getAllChapter(tractate, chapter);
    if (mishnas.length === 0) {
      throw new NotFoundException(`Chapter not found: ${tractate}/${chapter}`);
    }
    this.validateOperations(dto.operations, mishnas);
    return this.halachaOverrideRepository.upsert(
      tractate,
      chapter,
      dto.operations as HalachaOperation[],
      updatedBy,
    );
  }

  async deleteOverride(
    tractate: string,
    chapter: string,
  ): Promise<{ deleted: boolean }> {
    return this.halachaOverrideRepository.deleteByChapter(tractate, chapter);
  }

  // ============================================================
  // Composition (read path)
  // ============================================================

  /**
   * Apply overrides to a single-halacha request. Returns a transformed payload when
   * the halacha is involved in a `unify` operation; returns `null` when the caller
   * should just use the underlying raw Mishna doc (passthrough, or `split` which is
   * handled by Phase 3).
   *
   * For unify:
   *   - First source ('006'): composed view with `mishna='006'`, combined rich text /
   *     lines / excerpts, and a `_unified` marker.
   *   - Second source ('007'): same composed view, plus `_redirectTo='006'` so the FE
   *     replaces its URL to the canonical id.
   */
  async resolveMishna(
    tractate: string,
    chapter: string,
    mishnaId: string,
    opts: { part?: number } = {},
  ): Promise<ResolvedHalacha> {
    const override = await this.halachaOverrideRepository.findByChapter(
      tractate,
      chapter,
    );
    if (!override) return null;

    const operations = override.operations ?? [];

    // Unify takes precedence; the source can only be in one op anyway.
    const unify = operations.find(
      (op): op is Extract<HalachaOperation, { kind: 'unify' }> =>
        op.kind === 'unify' &&
        (op.sources[0] === mishnaId || op.sources[1] === mishnaId),
    );
    if (unify) {
      const [firstId, secondId] = unify.sources;
      const [first, second] = await Promise.all([
        this.mishnaRepository.find(tractate, chapter, firstId),
        this.mishnaRepository.find(tractate, chapter, secondId),
      ]);
      if (!first || !second) return null;
      const composed = this.composeUnify(first, second);
      const redirectTo = mishnaId === secondId ? firstId : undefined;
      return { kind: 'unified', mishna: composed, redirectTo };
    }

    // Split: the source halacha is presented as 2-3 mini-halachas. `opts.part` (1-based)
    // selects which mini-halacha to render; invalid/missing values default to part 1.
    const split = operations.find(
      (op): op is Extract<HalachaOperation, { kind: 'split' }> =>
        op.kind === 'split' && op.source === mishnaId,
    );
    if (split) {
      const sourceMishna = await this.mishnaRepository.find(
        tractate,
        chapter,
        split.source,
      );
      if (!sourceMishna) return null;
      const totalParts = split.sugiaBoundaries.length + 1;
      const requested = opts.part ?? 1;
      const partIdx = clamp(requested, 1, totalParts) - 1; // 0-based
      const composed = this.composeSplit(sourceMishna, split, partIdx);
      return { kind: 'split', mishna: composed };
    }

    return null;
  }

  /**
   * Compose the `partIdx`-th mini-halacha (0-based) of a split. The composed payload:
   *   - keeps `mishna = source.mishna` (URL is identical for all parts)
   *   - slices `richTextMishna` at the operation's `mishnaCuts`
   *   - slices `lines` at sugia boundaries; intro lines (before the first named sugia) live with part 1
   *   - filters `excerpts` to lines in range and remaps line indices
   *   - emits a `_split` marker the FE uses to render the in-page tab strip
   */
  private composeSplit(
    source: Mishna,
    op: Extract<HalachaOperation, { kind: 'split' }>,
    partIdx: number,
  ): any {
    const sourceLines = source.lines ?? [];
    const sourceBase = unwrapMongoose(source);
    const sugias = this.extractSugias(sourceLines);
    const totalParts = op.sugiaBoundaries.length + 1;

    // Resolve the source's line index range for this part using the sugia boundaries.
    // The first part owns sugias[0..b0), the second owns [b0..b1), and so on.
    // Intro lines (sugias with sugiaName === '') already sit at the start of `sugias` and
    // are naturally included in part 1 — that satisfies the "intro stays with the first
    // mini-halacha" rule from the spec.
    const sugiaStart = partIdx === 0 ? 0 : op.sugiaBoundaries[partIdx - 1];
    const sugiaEnd =
      partIdx === totalParts - 1
        ? sugias.length
        : op.sugiaBoundaries[partIdx];

    const firstLineIdx = sugias[sugiaStart]?.firstLineIndex ?? 0;
    const lastLineIdxExclusive =
      sugiaEnd < sugias.length
        ? sugias[sugiaEnd].firstLineIndex
        : sourceLines.length;

    // Lines for this part — renumber sublines locally so each composed slice has
    // contiguous 1-based subline indices, matching legacy expectations.
    let nextSublineIndex = 1;
    const partLines = sourceLines
      .slice(firstLineIdx, lastLineIdxExclusive)
      .map((line) => {
        const baseLine = unwrapMongoose(line);
        const renumberedSublines = (line.sublines ?? []).map((s) => ({
          ...unwrapMongoose(s),
          _sourceMishna: source.mishna,
          _originalIndex: s.index,
          index: nextSublineIndex++,
        }));
        return {
          ...baseLine,
          sublines: renumberedSublines,
          _sourceMishna: source.mishna,
        };
      });

    // Excerpts: keep only those whose selection lies fully inside the part's line range,
    // and remap their line indices to the part-local 0-based space.
    const partExcerpts = (source.excerpts ?? [])
      .map((e) => {
        const baseE = unwrapMongoose(e);
        if (!baseE.selection) return null;
        const { fromLine, toLine } = baseE.selection;
        if (
          fromLine === undefined ||
          toLine === undefined ||
          fromLine < firstLineIdx ||
          toLine >= lastLineIdxExclusive
        ) {
          return null;
        }
        return {
          ...baseE,
          selection: {
            ...baseE.selection,
            fromLine: fromLine - firstLineIdx,
            toLine: toLine - firstLineIdx,
          },
          _sourceMishna: source.mishna,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // Rich text: slice the Mishna at the configured cut points and pick this part's slice.
    // The slicer returns N+1 slices for N cuts — exactly aligned with our part count.
    const richSlices = sliceRichText(
      source.richTextMishna,
      op.mishnaCuts.map((c) => ({ blockKey: c.blockKey, offset: c.offset })),
    );
    const richTextMishna = richSlices[partIdx] ?? { blocks: [], entityMap: {} };

    return {
      ...sourceBase,
      mishna: source.mishna,
      lines: partLines,
      excerpts: partExcerpts,
      richTextMishna,
      _split: {
        source: source.mishna,
        currentPart: partIdx + 1, // expose 1-based to the FE
        totalParts,
      },
    };
  }

  /**
   * Composes a unified Mishna from two source documents. The result keeps the FIRST
   * source's id as `mishna` (so the URL canonicalizes to it), concatenates the rich
   * text via `concatRichText`, appends `b`'s lines after `a`'s with subline indices
   * renumbered sequentially, and shifts `b`'s excerpt line indices by `a.lines.length`.
   *
   * Each line and subline gets a `_sourceMishna` marker so the FE can render attribution
   * (used by the "which one to edit?" modal). The composed payload also carries
   * `_unified: { sources, canonicalId }` for the same reason.
   */
  private composeUnify(a: Mishna, b: Mishna): any {
    const aLines = a.lines ?? [];
    const bLines = b.lines ?? [];
    const aBase = unwrapMongoose(a);
    const bBase = unwrapMongoose(b);

    let nextSublineIndex = 1;
    const renumberLine = (line: Line, sourceMishna: string) => {
      const baseLine = unwrapMongoose(line);
      const renumberedSublines = (line.sublines ?? []).map((s) => ({
        ...unwrapMongoose(s),
        _sourceMishna: sourceMishna,
        _originalIndex: s.index,
        index: nextSublineIndex++,
      }));
      return {
        ...baseLine,
        sublines: renumberedSublines,
        _sourceMishna: sourceMishna,
      };
    };

    const mergedLines = [
      ...aLines.map((l) => renumberLine(l, a.mishna)),
      ...bLines.map((l) => renumberLine(l, b.mishna)),
    ];

    const aLineCount = aLines.length;
    const mergedExcerpts = [
      ...((a.excerpts ?? []).map((e) => ({
        ...unwrapMongoose(e),
        _sourceMishna: a.mishna,
      }))),
      ...((b.excerpts ?? []).map((e) => {
        const baseE = unwrapMongoose(e);
        return {
          ...baseE,
          selection: baseE.selection
            ? {
                ...baseE.selection,
                fromLine: (baseE.selection.fromLine ?? 0) + aLineCount,
                toLine: (baseE.selection.toLine ?? 0) + aLineCount,
              }
            : baseE.selection,
          _sourceMishna: b.mishna,
        };
      })),
    ];

    return {
      ...aBase,
      // URL identity stays the first source; the FE renders the unified display name.
      mishna: a.mishna,
      lines: mergedLines,
      excerpts: mergedExcerpts,
      richTextMishna: concatRichText(a.richTextMishna, b.richTextMishna),
      _unified: {
        sources: [a.mishna, b.mishna] as [string, string],
        canonicalId: a.mishna,
      },
    };
  }

  /**
   * Overlay a tractate document's `chapters[].mishnaiot` lists with unify overrides.
   * For each unified pair (a, b), the entry for `a` gets `unifiedWith=b` and the entry
   * for `b` is removed. Splits don't change the nav list (per spec).
   *
   * Loads ALL chapter overrides for the tractate in one query; tractate fetches are rare
   * so the extra round-trip is acceptable.
   */
  async overlayTractateNavList<T extends { id: string; chapters: any[] }>(
    tractate: T,
  ): Promise<T> {
    const allOverrides =
      await this.halachaOverrideRepository.findAllForTractate?.(tractate.id);
    // If the repo method isn't available (e.g. older code path), bail out gracefully.
    if (!allOverrides || allOverrides.length === 0) return tractate;

    const overrideByChapter = new Map(
      allOverrides.map((o) => [o.chapter, o] as const),
    );

    const overlaidChapters = tractate.chapters.map((chapter) => {
      const override = overrideByChapter.get(chapter.id);
      if (!override) return chapter;
      const mishnaiot = this.overlayMishnaList(
        chapter.mishnaiot ?? [],
        override.operations ?? [],
      );
      return { ...unwrapMongoose(chapter), mishnaiot };
    });

    return { ...unwrapMongoose(tractate), chapters: overlaidChapters } as T;
  }

  /** Apply unify overlays to one chapter's mishnaiot list (splits don't affect it). */
  private overlayMishnaList(
    mishnaiot: any[],
    operations: HalachaOperation[],
  ): OverlaidMishnaRef[] {
    // Map: second-source-id -> first-source-id, and: first-source-id -> second-source-id.
    const secondSources = new Set<string>();
    const partnerOf = new Map<string, string>();
    for (const op of operations) {
      if (op.kind === 'unify') {
        partnerOf.set(op.sources[0], op.sources[1]);
        secondSources.add(op.sources[1]);
      }
    }

    const out: OverlaidMishnaRef[] = [];
    for (const ref of mishnaiot) {
      const base = unwrapMongoose(ref);
      if (secondSources.has(base.mishna)) continue; // folded into the prior entry
      const partner = partnerOf.get(base.mishna);
      out.push(partner ? { ...base, unifiedWith: partner } : base);
    }
    return out;
  }

  /**
   * For `getChapter` callers: compute the overlaid count of halachas in the chapter
   * (each unify shrinks the count by 1). Splits don't affect it.
   */
  async overlaidChapterCount(
    tractate: string,
    chapter: string,
    rawCount: number,
  ): Promise<number> {
    const override = await this.halachaOverrideRepository.findByChapter(
      tractate,
      chapter,
    );
    if (!override) return rawCount;
    const unifyCount = (override.operations ?? []).filter(
      (op) => op.kind === 'unify',
    ).length;
    return rawCount - unifyCount;
  }

  // ============================================================
  // Validation
  // ============================================================

  private validateOperations(
    operations: (UnifyOperationDto | SplitOperationDto)[],
    mishnas: Mishna[],
  ): void {
    const sourceIds = mishnas.map((m) => m.mishna);
    const sourceSet = new Set(sourceIds);

    // Source-uniqueness across operations: every referenced source can appear in at most one op.
    const claimed = new Set<string>();
    const claim = (id: string, opIdx: number) => {
      if (claimed.has(id)) {
        throw new BadRequestException(
          `Halacha "${id}" is referenced by more than one operation (operation index ${opIdx})`,
        );
      }
      claimed.add(id);
    };

    operations.forEach((op, opIdx) => {
      if (op.kind === 'unify') {
        this.validateUnify(op, sourceIds, sourceSet, opIdx);
        claim(op.sources[0], opIdx);
        claim(op.sources[1], opIdx);
      } else if (op.kind === 'split') {
        this.validateSplit(op, sourceSet, mishnas, opIdx);
        claim(op.source, opIdx);
      } else {
        // Should be impossible after DTO validation; defensive guard.
        throw new BadRequestException(
          `Unknown operation kind at index ${opIdx}`,
        );
      }
    });
  }

  private validateUnify(
    op: UnifyOperationDto,
    sourceIds: string[],
    sourceSet: Set<string>,
    opIdx: number,
  ): void {
    const [a, b] = op.sources;
    if (a === b) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: sources must be two DISTINCT halachas`,
      );
    }
    if (!sourceSet.has(a) || !sourceSet.has(b)) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: source halacha not found in chapter (${a} or ${b})`,
      );
    }
    const ia = sourceIds.indexOf(a);
    const ib = sourceIds.indexOf(b);
    if (ib !== ia + 1) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: sources must be ADJACENT in chapter order (got ${a},${b})`,
      );
    }
  }

  private validateSplit(
    op: SplitOperationDto,
    sourceSet: Set<string>,
    mishnas: Mishna[],
    opIdx: number,
  ): void {
    if (!sourceSet.has(op.source)) {
      throw new BadRequestException(
        `Split operation ${opIdx}: source halacha not found (${op.source})`,
      );
    }
    if (op.sugiaBoundaries.length !== op.mishnaCuts.length) {
      throw new BadRequestException(
        `Split operation ${opIdx}: sugiaBoundaries and mishnaCuts must have equal length`,
      );
    }

    const sourceMishna = mishnas.find((m) => m.mishna === op.source);
    const sugias = this.extractSugias(sourceMishna.lines ?? []);
    const sugiaCount = sugias.length;
    const partCount = op.sugiaBoundaries.length + 1;

    if (sugiaCount < partCount) {
      throw new BadRequestException(
        `Split operation ${opIdx}: source halacha "${op.source}" has only ${sugiaCount} sugia(s); ` +
          `cannot split into ${partCount} parts (each part needs ≥1 sugia)`,
      );
    }

    // Strictly increasing, all in (0, sugiaCount); first part is sugias[0..b0-1],
    // second is sugias[b0..b1-1], etc. So every boundary must be ≥1 and ≤sugiaCount-1.
    let prev = 0;
    for (const b of op.sugiaBoundaries) {
      if (b <= prev || b >= sugiaCount) {
        throw new BadRequestException(
          `Split operation ${opIdx}: sugiaBoundaries must be strictly increasing in (0, ${sugiaCount}); got [${op.sugiaBoundaries.join(', ')}]`,
        );
      }
      prev = b;
    }

    // Each mishnaCut must address a real (blockKey, offset) inside richTextMishna.
    const rtm = sourceMishna.richTextMishna;
    if (!rtm || !Array.isArray(rtm.blocks) || rtm.blocks.length === 0) {
      throw new BadRequestException(
        `Split operation ${opIdx}: source halacha "${op.source}" has no richTextMishna to cut`,
      );
    }
    op.mishnaCuts.forEach((cut, cutIdx) => {
      const block = rtm.blocks.find((b) => b.key === cut.blockKey);
      if (!block) {
        throw new BadRequestException(
          `Split operation ${opIdx}: mishnaCut ${cutIdx} references unknown blockKey "${cut.blockKey}"`,
        );
      }
      const max = (block.text ?? '').length;
      if (cut.offset < 0 || cut.offset > max) {
        throw new BadRequestException(
          `Split operation ${opIdx}: mishnaCut ${cutIdx} offset ${cut.offset} out of range [0..${max}] for blockKey "${cut.blockKey}"`,
        );
      }
    });
  }

  // ============================================================
  // Sugia extraction
  // ============================================================

  /**
   * Detects sugia blocks inside a Halacha by scanning `subline.sugiaName` — that's
   * the field the FE treats as authoritative (`MainLine.tsx`, `mishnaUtils.ts`).
   *
   * Rules:
   *   - A new sugia starts on any line whose sublines contain a non-empty sugiaName.
   *   - Subsequent lines (without their own sugiaName) extend the current sugia.
   *   - Lines that appear BEFORE the first named sugia are treated as an anonymous
   *     "intro" sugia — split composition will glue these to part 1.
   */
  extractSugias(lines: Line[]): SugiaInfo[] {
    const result: SugiaInfo[] = [];
    let current: SugiaInfo | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sublines = (line.sublines as SubLine[] | undefined) ?? [];
      const firstNamed = sublines.find(
        (s) => s.sugiaName && s.sugiaName.trim() !== '',
      );
      const firstSublineIndex = sublines[0]?.index ?? 0;

      if (firstNamed) {
        current = {
          sugiaName: firstNamed.sugiaName!.trim(),
          firstSublineIndex,
          firstLineNumber: line.lineNumber ?? '',
          firstLineIndex: i,
          lineCount: 1,
        };
        result.push(current);
      } else if (current) {
        current.lineCount += 1;
      } else {
        // Intro block before any named sugia
        current = {
          sugiaName: '',
          firstSublineIndex,
          firstLineNumber: line.lineNumber ?? '',
          firstLineIndex: i,
          lineCount: 1,
        };
        result.push(current);
      }
    }
    return result;
  }
}

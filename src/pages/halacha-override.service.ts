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
import { concatRichText } from './inc/draftjsMerge';
import { sliceRichText } from './inc/draftjs-slice';

/**
 * Result of resolving a halacha against a chapter's overrides.
 * `null` means "no transformation needed — caller should use the raw Mishna doc".
 */
export type ResolvedHalacha =
  | {
      kind: 'unified';
      mishna: any;
      /** Canonical URL the FE should replace to (set only when the request hit the second source). */
      redirectTo?: { tractate: string; chapter: string; mishna: string };
    }
  | { kind: 'split'; mishna: any }
  | null;

/**
 * Reference shape used in the tractate doc's `chapters[].mishnaiot` array.
 * We add an optional `unifiedWithAll` field so the FE can render combined labels
 * like "\u05d5-\u05d6" or "\u05d5-\u05d6-\u05d7" without the BE knowing about Hebrew letters.
 */
export interface OverlaidMishnaRef {
  id: string;
  mishna: string;
  mishnaRef?: any;
  /** When set, this entry is the first source of a unify and `unifiedWithAll` lists ALL
   *  sources in chapter order (length 2 or 3). The first element equals `mishna`. */
  unifiedWithAll?: string[];
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
        op.kind === 'unify' && op.sources.includes(mishnaId),
    );
    if (unify) {
      const sourceDocs = await Promise.all(
        unify.sources.map((id) =>
          this.mishnaRepository.find(tractate, chapter, id),
        ),
      );
      if (sourceDocs.some((d) => !d)) return null;
      const composed = this.composeUnify(sourceDocs as Mishna[]);
      // The composed Mishna's neighbor markers can themselves point at non-first-sources
      // of OTHER unify groups in the same chapter — rewrite them to the canonical first.
      const overlaid = this.rewriteNeighborMarkers(composed, operations);
      // Any non-first source URL canonicalizes to the first source.
      const firstId = unify.sources[0];
      const redirectTo =
        mishnaId === firstId
          ? undefined
          : { tractate, chapter, mishna: firstId };
      return { kind: 'unified', mishna: overlaid, redirectTo };
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
      // Split parts inherit `previous`/`next` from the source Mishna, so if a neighbor is
      // the second source of a unify, rewrite it to the canonical first-source.
      const overlaid = this.rewriteNeighborMarkers(composed, operations);
      return { kind: 'split', mishna: overlaid };
    }

    return null;
  }

  /**
   * Post-process raw search results so the FE can build correct deep-links into split /
   * unified halachas:
   *   - Split: stamps `part: N` (1-based) on the result, computed from the result's
   *     `lineNumber` against the source halacha's sugia boundaries. Intro lines (before
   *     the first named sugia) belong to part 1, matching `composeSplit`'s rule.
   *   - Unify: if the result's guid points at a NON-FIRST source of a unify group, the
   *     guid is rewritten to the canonical first source so the search link bypasses the
   *     redirect round-trip on click.
   *
   * Performs at most one override fetch + one source-mishna fetch per unique affected
   * (chapter, mishna), so it scales linearly with the result set, not quadratically.
   */
  async decorateSearchResults<
    T extends { guid: string; lineNumber: string },
  >(tractate: string, results: T[]): Promise<(T & { part?: number })[]> {
    if (results.length === 0) return results as (T & { part?: number })[];

    const allOverrides =
      (await this.halachaOverrideRepository.findAllForTractate?.(tractate)) ??
      [];
    if (allOverrides.length === 0)
      return results as (T & { part?: number })[];

    // Look up overrides by chapter for O(1) per-result access.
    const overrideByChapter = new Map(
      allOverrides.map((o) => [o.chapter, o] as const),
    );

    // Per-source-mishna sugia cache. Only loaded for halachas that actually have a split
    // override AND show up in this result batch.
    const sugiaCache = new Map<string, SugiaInfo[]>();
    const loadSugias = async (
      chapter: string,
      mishnaId: string,
    ): Promise<SugiaInfo[]> => {
      const cacheKey = `${chapter}|${mishnaId}`;
      const cached = sugiaCache.get(cacheKey);
      if (cached) return cached;
      const m = await this.mishnaRepository.find(tractate, chapter, mishnaId);
      const sugias = m ? this.extractSugias(m.lines ?? []) : [];
      // Also cache the source's line-number → array-index map for the same key, to
      // avoid re-scanning `lines` per result.
      sugiaCache.set(cacheKey, sugias);
      if (m) {
        lineIndexCache.set(
          cacheKey,
          new Map(m.lines.map((l, i) => [l.lineNumber ?? '', i] as const)),
        );
      }
      return sugias;
    };
    const lineIndexCache = new Map<string, Map<string, number>>();

    const decorated: (T & { part?: number })[] = [];
    for (const r of results) {
      // GUID format is `<tractate>_<chapter>_<mishna>` — tractate may contain underscores
      // (e.g. "avoda_zara"), but chapter/mishna are always the last two 3-digit segments.
      const parts = r.guid.split('_');
      if (parts.length < 3) {
        decorated.push(r);
        continue;
      }
      const chapter = parts[parts.length - 2];
      const mishnaId = parts[parts.length - 1];

      const override = overrideByChapter.get(chapter);
      if (!override) {
        decorated.push(r);
        continue;
      }
      const operations = override.operations ?? [];

      // Unify canonical rewrite (if the result lives in a non-first source).
      const unify = operations.find(
        (op): op is Extract<HalachaOperation, { kind: 'unify' }> =>
          op.kind === 'unify' && op.sources.indexOf(mishnaId) > 0,
      );
      if (unify) {
        const canonical = unify.sources[0];
        // Tractate prefix may contain underscores (e.g. "avoda_zara"), so reconstruct it
        // by joining everything BEFORE the trailing chapter+mishna pair.
        const tractatePrefix = parts.slice(0, -2).join('_');
        decorated.push({
          ...r,
          guid: `${tractatePrefix}_${chapter}_${canonical}`,
        });
        continue;
      }

      // Split → compute the part by line index.
      const split = operations.find(
        (op): op is Extract<HalachaOperation, { kind: 'split' }> =>
          op.kind === 'split' && op.source === mishnaId,
      );
      if (split) {
        const sugias = await loadSugias(chapter, mishnaId);
        const lineIndexMap = lineIndexCache.get(`${chapter}|${mishnaId}`);
        const lineIdx = lineIndexMap?.get(r.lineNumber);
        if (sugias.length === 0 || lineIdx === undefined) {
          // Defensive: shouldn't happen, but bail to part 1 silently.
          decorated.push(r);
          continue;
        }
        // sugiaBoundaries are indices in the sugia list at which each new part begins.
        // Map them to absolute line indices once.
        const boundaryLineIdxs = split.sugiaBoundaries.map(
          (b) => sugias[b]?.firstLineIndex ?? Infinity,
        );
        let part = 1;
        for (const bIdx of boundaryLineIdxs) {
          if (lineIdx >= bIdx) part++;
          else break;
        }
        decorated.push({ ...r, part });
        continue;
      }

      decorated.push(r);
    }
    return decorated;
  }

  /**
   * Public passthrough hook: when a Mishna is NOT itself part of an override (i.e. the
   * raw doc is being returned to the user), we still need to rewrite its `previous`/`next`
   * markers if they happen to point at the SECOND source of a unify pair. Otherwise the
   * FE takes a detour via the second-source URL (which then `_redirectTo`s back to the
   * canonical first-source URL) every time the user clicks back/forward.
   *
   * Returns the Mishna unchanged if no unify operations exist for the chapter.
   */
  async applyNavOverlay<T = any>(
    mishna: T,
    tractate: string,
    chapter: string,
  ): Promise<T> {
    const override = await this.halachaOverrideRepository.findByChapter(
      tractate,
      chapter,
    );
    if (!override?.operations?.length) return mishna;
    return this.rewriteNeighborMarkers(mishna as any, override.operations);
  }

  /**
   * Pure helper: given a single neighbor marker (`previous` or `next`), returns a
   * canonicalized version where any reference to a NON-FIRST source of a unify (i.e.
   * sources[1] or sources[2]) is replaced with sources[0]. Used by both this service
   * and `NavigationService`.
   */
  rewriteMarker<T extends { mishna?: string } | undefined>(
    marker: T,
    operations: HalachaOperation[],
  ): T {
    if (!marker?.mishna) return marker;
    const unifies = operations.filter(
      (op): op is Extract<HalachaOperation, { kind: 'unify' }> => op.kind === 'unify',
    );
    // A marker is canonicalized if its mishna appears as a non-first source of any unify.
    const u = unifies.find((u) => u.sources.indexOf(marker.mishna!) > 0);
    if (!u) return marker;
    return { ...marker, mishna: u.sources[0] } as T;
  }

  /**
   * Rewrites `previous` / `next` markers on `mishna` so that any reference to a unify's
   * second source is replaced with the corresponding first source (the canonical URL).
   * Returns the Mishna unchanged if none of its markers point at a second source.
   */
  private rewriteNeighborMarkers(mishna: any, operations: HalachaOperation[]): any {
    const base = unwrapMongoose(mishna);
    const newPrevious = this.rewriteMarker(base.previous, operations);
    const newNext = this.rewriteMarker(base.next, operations);
    if (newPrevious === base.previous && newNext === base.next) {
      return mishna;
    }
    return { ...base, previous: newPrevious, next: newNext };
  }

  /**
   * Compose the `partIdx`-th mini-halacha (0-based) of a split. The composed payload:
   *   - keeps `mishna = source.mishna` (URL is identical for all parts)
   *   - slices `richTextMishna` at the operation's `mishnaCuts`
   *   - slices `lines` at sugia boundaries; intro lines (before the first named sugia) live with part 1
   *   - filters `excerpts` to lines in range and remaps line indices
   *   - emits a `_split` marker the FE uses to render the in-page tab strip
   */
  /**
   * Rewrites `categories[].connections[].sublineIndex` on the given composed sublines
   * to use the renumbered (local) indices. Each subline carries `_sourceMishna` and
   * `_originalIndex` markers (stamped by composeSplit/composeUnify), which we use to
   * build a per-source `originalIndex -> newIndex` lookup. Without this rewrite, the
   * tagged sidebar shows stale numbers ("שורה 5" when no subline 5 is in view) and
   * `CategoryConnectionLines` fails to find DOM refs by index.
   *
   * Connections of type `subline` whose original target is missing from the composed
   * slice (e.g. a tag on part 1 of a split that links into part 2) are dropped — the
   * intended workflow is split-first / tag-after, so cross-part connections are stale
   * mistakes rather than meaningful links. The persisted data is untouched on the
   * source mishna, so reverting the split brings them back.
   *
   * `external` connections (numeric-free text refs), `rabbiMentions` (char offsets,
   * not subline refs) and `comments` are left as-is.
   *
   * Mutates each subline's `categories` array in place.
   */
  /**
   * Builds a `sourceMishna -> (originalSublineIndex -> newLocalIndex)` lookup from
   * composed sublines. Each subline carries `_sourceMishna` and `_originalIndex`
   * markers stamped by composeSplit / composeUnify.
   *
   * Shared by every helper that needs to remap persisted subline references
   * (category connections, excerpt selections, ...) onto the renumbered space.
   */
  private buildSublineIndexMap(
    sublines: any[],
  ): Map<string, Map<number, number>> {
    const mapBySource = new Map<string, Map<number, number>>();
    for (const s of sublines) {
      const sourceKey = s._sourceMishna ?? '';
      if (!mapBySource.has(sourceKey)) {
        mapBySource.set(sourceKey, new Map());
      }
      if (s._originalIndex != null) {
        mapBySource.get(sourceKey)!.set(s._originalIndex, s.index);
      }
    }
    return mapBySource;
  }

  private rewriteCategoryConnections(sublines: any[]): void {
    const mapBySource = this.buildSublineIndexMap(sublines);

    for (const s of sublines) {
      if (!s.categories?.length) continue;
      const map = mapBySource.get(s._sourceMishna ?? '');
      if (!map) continue;
      s.categories = s.categories.map((cat: any) => {
        const baseCat = unwrapMongoose(cat);
        const rewritten = (baseCat.connections ?? [])
          .map((c: any) => {
            const baseC = unwrapMongoose(c);
            if (baseC.type !== 'subline') return baseC;
            const newIdx =
              baseC.sublineIndex != null
                ? map.get(baseC.sublineIndex)
                : undefined;
            if (newIdx == null) return null; // cross-slice or unknown — drop
            return { ...baseC, sublineIndex: newIdx };
          })
          .filter((c: any) => c !== null);
        return { ...baseCat, connections: rewritten };
      });
    }
  }

  /**
   * Rewrites `selection.fromSubline` / `selection.toSubline` on composed excerpts
   * so the side panel ("add-ons" — talmudic parallels, citations, ...) highlights
   * the right lines after split / unify.
   *
   * Excerpt `fromLine` / `toLine` (array indices) are already shifted into the
   * composed line space at the point this is called. The subline refs are stored
   * as document-global `subline.index` values from the source mishna (see
   * `excerptUtils.ts`), so once compose renumbers sublines they're stale — exactly
   * the same bug class as `rewriteCategoryConnections`.
   *
   * The excerpt's `_sourceMishna` marker (stamped by both compose paths) tells us
   * which source map to apply. If a subline ref isn't in the map (defensive — for
   * a split the line-range filter should already have dropped the excerpt) the
   * field is left untouched rather than crashing the page.
   *
   * Returns a new array; never mutates the input excerpts.
   */
  private rewriteExcerptSelections(
    excerpts: any[],
    sublines: any[],
  ): any[] {
    const mapBySource = this.buildSublineIndexMap(sublines);
    return excerpts.map((e) => {
      const map = mapBySource.get(e._sourceMishna ?? '');
      if (!map || !e.selection) return e;
      const sel = e.selection;
      const fromSubline =
        sel.fromSubline != null ? map.get(sel.fromSubline) : undefined;
      const toSubline =
        sel.toSubline != null ? map.get(sel.toSubline) : undefined;
      return {
        ...e,
        selection: {
          ...sel,
          ...(fromSubline != null ? { fromSubline } : {}),
          ...(toSubline != null ? { toSubline } : {}),
        },
      };
    });
  }

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

    // Rewrite category-connection subline refs to match the renumbered indices.
    // Cross-part connections (e.g. a tag in this part pointing into another part)
    // are dropped here; see `rewriteCategoryConnections` for rationale.
    this.rewriteCategoryConnections(
      partLines.flatMap((l) => l.sublines ?? []),
    );

    // Excerpts: keep only those whose selection lies fully inside the part's line range,
    // and remap their line indices to the part-local 0-based space.
    const partExcerptsRaw = (source.excerpts ?? [])
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

    // Excerpt subline refs (`selection.fromSubline` / `selection.toSubline`) are
    // document-global indices from the source mishna; rewrite them to match the
    // renumbered part-local sublines so the side panel highlights the right rows.
    const partExcerpts = this.rewriteExcerptSelections(
      partExcerptsRaw,
      partLines.flatMap((l) => l.sublines ?? []),
    );

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
   * Composes a unified Mishna from 2-3 source documents in chapter order. The result keeps
   * the FIRST source's id as `mishna` (so the URL canonicalizes to it), folds rich text
   * via `concatRichText`, appends each subsequent source's lines with subline indices
   * renumbered globally, and shifts each subsequent source's excerpt line indices by the
   * running total of lines already merged.
   *
   * Each line, subline, and excerpt gets a `_sourceMishna` marker so the FE can render
   * attribution (used by the "which one to edit?" modal). The composed payload also
   * carries `_unified: { sources, canonicalId }`.
   */
  private composeUnify(sources: Mishna[]): any {
    if (sources.length < 2) {
      // Defensive — semantic validation in `validateUnify` should already prevent this.
      throw new Error('composeUnify expects at least 2 sources');
    }
    const firstBase = unwrapMongoose(sources[0]);
    const lastBase = unwrapMongoose(sources[sources.length - 1]);

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

    const mergedLines: any[] = [];
    const mergedExcerpts: any[] = [];
    let lineOffset = 0;
    let mergedRichText = null as any;

    for (const src of sources) {
      const srcLines = src.lines ?? [];
      for (const line of srcLines) {
        mergedLines.push(renumberLine(line, src.mishna));
      }
      for (const e of src.excerpts ?? []) {
        const baseE = unwrapMongoose(e);
        mergedExcerpts.push({
          ...baseE,
          selection: baseE.selection
            ? {
                ...baseE.selection,
                fromLine: (baseE.selection.fromLine ?? 0) + lineOffset,
                toLine: (baseE.selection.toLine ?? 0) + lineOffset,
              }
            : baseE.selection,
          _sourceMishna: src.mishna,
        });
      }
      mergedRichText = mergedRichText
        ? concatRichText(mergedRichText, src.richTextMishna)
        : src.richTextMishna;
      lineOffset += srcLines.length;
    }

    // Rewrite category-connection subline refs to match the renumbered (global-across-
    // sources) indices. Unify keeps every source subline in view, so no connections
    // should be dropped here; the helper is still defensive about unknown targets.
    const allSublines = mergedLines.flatMap((l) => l.sublines ?? []);
    this.rewriteCategoryConnections(allSublines);

    // Same remap, applied to excerpt subline refs so the side panel highlights the
    // right rows in the unified view. Excerpt line indices were already shifted by
    // `lineOffset` during the merge above.
    const finalExcerpts = this.rewriteExcerptSelections(mergedExcerpts, allSublines);

    return {
      ...firstBase,
      // URL identity stays the first source; the FE renders the unified display name.
      mishna: sources[0].mishna,
      lines: mergedLines,
      excerpts: finalExcerpts,
      richTextMishna: mergedRichText ?? { blocks: [], entityMap: {} },
      // Navigation arrows must skip the group entirely.
      // `previous` from the first source is what came before the group; `next` from the
      // first source would wrongly point inside the group, so we take the LAST source's `next`.
      previous: firstBase.previous,
      next: lastBase.next,
      _unified: {
        sources: sources.map((s) => s.mishna),
        canonicalId: sources[0].mishna,
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
    // Map: first-source-id -> all-sources, and: set of non-first sources to drop.
    const nonFirstSources = new Set<string>();
    const groupByFirst = new Map<string, string[]>();
    for (const op of operations) {
      if (op.kind === 'unify') {
        groupByFirst.set(op.sources[0], op.sources);
        for (let i = 1; i < op.sources.length; i++) {
          nonFirstSources.add(op.sources[i]);
        }
      }
    }

    const out: OverlaidMishnaRef[] = [];
    for (const ref of mishnaiot) {
      const base = unwrapMongoose(ref);
      if (nonFirstSources.has(base.mishna)) continue; // folded into the first-source entry
      const group = groupByFirst.get(base.mishna);
      out.push(group ? { ...base, unifiedWithAll: group } : base);
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
    // Each unify of N sources collapses N halachas into 1, i.e. shrinks the count by N-1.
    const shrinkage = (override.operations ?? []).reduce((sum, op) => {
      return op.kind === 'unify' ? sum + (op.sources.length - 1) : sum;
    }, 0);
    return rawCount - shrinkage;
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
        op.sources.forEach((s) => claim(s, opIdx));
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
    if (op.sources.length < 2 || op.sources.length > 3) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: must have 2 or 3 sources (got ${op.sources.length})`,
      );
    }
    if (new Set(op.sources).size !== op.sources.length) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: sources must be DISTINCT halachas`,
      );
    }
    for (const s of op.sources) {
      if (!sourceSet.has(s)) {
        throw new BadRequestException(
          `Unify operation ${opIdx}: source halacha not found in chapter (${s})`,
        );
      }
    }
    // Each consecutive pair must be adjacent in the chapter's halacha order.
    for (let i = 1; i < op.sources.length; i++) {
      const prevIdx = sourceIds.indexOf(op.sources[i - 1]);
      const currIdx = sourceIds.indexOf(op.sources[i]);
      if (currIdx !== prevIdx + 1) {
        throw new BadRequestException(
          `Unify operation ${opIdx}: sources must be ADJACENT in chapter order (got ${op.sources.join(',')})`,
        );
      }
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

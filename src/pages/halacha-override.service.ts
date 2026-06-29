import { Injectable, NotFoundException } from '@nestjs/common';
import { RawDraftContentState } from 'draft-js';
import { MishnaRepository } from './mishna.repository';
import { HalachaOverrideRepository } from './halacha-override.repository';
import {
  HalachaOperation,
  HalachaOverride,
} from './schemas/halacha-override.schema';
import { UpsertHalachaOverrideDto } from './dto/halacha-override.dto';
import { Mishna } from './schemas/mishna.schema';
import { extractSugias, SugiaInfo } from './inc/sugiaUtils';
import { validateOperations } from './inc/overrideValidation';
import { overlayMishnaList } from './inc/overlayUtils';
import { unwrapMongoose } from './inc/mongooseUtils';
import { rewriteNeighborMarkers } from './inc/composeRewriters';
import { composeSplit, composeUnify } from './inc/composeMishna';

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

/** Per-Halacha summary returned alongside the override doc to drive the admin UI. */
export interface HalachaStructure {
  /** Halacha id as stored on the source Mishna (zero-padded numeric). */
  source: string;
  /** Ordered sugias detected inside the Halacha. */
  sugias: SugiaInfo[];
  /** The Mishna's rich text — needed by the editor's "Mishna cut picker". */
  richTextMishna: RawDraftContentState | null;
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
      sugias: extractSugias(m.lines ?? []),
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
    validateOperations(dto.operations, mishnas);
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
      const composed = composeUnify(sourceDocs as Mishna[]);
      // The composed Mishna's neighbor markers can themselves point at non-first-sources
      // of OTHER unify groups in the same chapter — rewrite them to the canonical first.
      const overlaid = rewriteNeighborMarkers(composed, operations);
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
      const composed = composeSplit(sourceMishna, split, partIdx);
      // Split parts inherit `previous`/`next` from the source Mishna, so if a neighbor is
      // the second source of a unify, rewrite it to the canonical first-source.
      const overlaid = rewriteNeighborMarkers(composed, operations);
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
      const sugias = m ? extractSugias(m.lines ?? []) : [];
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
    return rewriteNeighborMarkers(mishna as any, override.operations);
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
      const mishnaiot = overlayMishnaList(
        chapter.mishnaiot ?? [],
        override.operations ?? [],
      );
      return { ...unwrapMongoose(chapter), mishnaiot };
    });

    return { ...unwrapMongoose(tractate), chapters: overlaidChapters } as T;
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

}

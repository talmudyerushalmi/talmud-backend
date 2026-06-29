import { Line } from '../models/line.model';
import { HalachaOperation } from '../schemas/halacha-override.schema';
import { Mishna } from '../schemas/mishna.schema';
import {
  rewriteCategoryConnections,
  rewriteExcerptSelections,
} from './composeRewriters';
import { concatRichText } from './draftjsMerge';
import { sliceRichText } from './draftjsSlice';
import { unwrapMongoose } from './mongooseUtils';
import { extractSugias } from './sugiaUtils';

/**
 * Compose the `partIdx`-th mini-halacha (0-based) of a split. The composed payload:
 *   - keeps `mishna = source.mishna` (URL is identical for all parts)
 *   - slices `richTextMishna` at the operation's `mishnaCuts`
 *   - slices `lines` at sugia boundaries; intro lines (before the first named sugia) live with part 1
 *   - filters `excerpts` to lines in range and remaps line indices
 *   - emits a `_split` marker the FE uses to render the in-page tab strip
 */
export function composeSplit(
  source: Mishna,
  op: Extract<HalachaOperation, { kind: 'split' }>,
  partIdx: number,
): any {
  const sourceLines = source.lines ?? [];
  const sourceBase = unwrapMongoose(source);
  const sugias = extractSugias(sourceLines);
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
  rewriteCategoryConnections(
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
  const partExcerpts = rewriteExcerptSelections(
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
export function composeUnify(sources: Mishna[]): any {
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
  rewriteCategoryConnections(allSublines);

  // Same remap, applied to excerpt subline refs so the side panel highlights the
  // right rows in the unified view. Excerpt line indices were already shifted by
  // `lineOffset` during the merge above.
  const finalExcerpts = rewriteExcerptSelections(mergedExcerpts, allSublines);

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

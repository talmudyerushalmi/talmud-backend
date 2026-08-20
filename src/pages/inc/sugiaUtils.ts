import { Line, SubLine } from '../models/line.model';

/** A detected sugia block inside a Halacha, used by split composition and the admin UI. */
export interface SugiaInfo {
  /** Display name (the value of `sugiaName` on the subline that introduces this sugia). */
  sugiaName: string;
  /** Global 1-based subline index that STARTS this sugia (matches `SubLine.index`). */
  firstSublineIndex: number;
  /** `lineNumber` of the first line containing this sugia. */
  firstLineNumber: string;
  /** Position of the first line in the source's `lines` array (0-based). Used internally
   *  for line-range slicing during split composition. */
  firstLineIndex: number;
  /** Number of lines this sugia spans (from `firstLineIndex` until the next sugia's
   *  first line, or end-of-halacha). Adjacent sugias that share a line — i.e. one
   *  sugia ends mid-line and the next starts on the same line — will each report
   *  ≥1 for `lineCount` and their line ranges will overlap. Split composition
   *  rejects such mid-line boundaries via `validateSplit`. */
  lineCount: number;
  /** Exact number of sublines that belong to this sugia. Unlike `lineCount`, this
   *  is precise even when multiple sugias share a line. Used by the AI-tagging
   *  export to slice out each sugia's sublines cleanly. */
  sublineCount: number;
}

/**
 * Detects sugia blocks inside a Halacha by scanning `subline.sugiaName` — that's
 * the field the FE treats as authoritative (`MainLine.tsx`, `mishnaUtils.ts`).
 *
 * Rules:
 *   - A new sugia starts on any subline whose `sugiaName` is non-empty.
 *   - Subsequent sublines (without their own sugiaName) extend the current sugia.
 *   - Sublines that appear BEFORE the first named sugia are treated as an anonymous
 *     "intro" sugia — split composition will glue these to part 1.
 *
 * Scans at SUBLINE granularity (not line granularity), so a line that contains the
 * end of one sugia AND the start of the next is handled correctly — both sugias
 * appear in the output with the right `sublineCount`.
 */
export function extractSugias(lines: Line[]): SugiaInfo[] {
  const result: SugiaInfo[] = [];
  let current: SugiaInfo | null = null;
  let lastLineIdxForCurrent = -1;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const sublines = (line.sublines as SubLine[] | undefined) ?? [];
    const lineNumber = line.lineNumber ?? '';

    for (const subline of sublines) {
      const isNamed = !!(subline.sugiaName && subline.sugiaName.trim() !== '');

      if (isNamed) {
        current = {
          sugiaName: subline.sugiaName!.trim(),
          firstSublineIndex: subline.index,
          firstLineNumber: lineNumber,
          firstLineIndex: lineIdx,
          lineCount: 1,
          sublineCount: 1,
        };
        result.push(current);
        lastLineIdxForCurrent = lineIdx;
      } else if (!current) {
        current = {
          sugiaName: '',
          firstSublineIndex: subline.index,
          firstLineNumber: lineNumber,
          firstLineIndex: lineIdx,
          lineCount: 1,
          sublineCount: 1,
        };
        result.push(current);
        lastLineIdxForCurrent = lineIdx;
      } else {
        current.sublineCount += 1;
        if (lineIdx !== lastLineIdxForCurrent) {
          current.lineCount += 1;
          lastLineIdxForCurrent = lineIdx;
        }
      }
    }
  }
  return result;
}

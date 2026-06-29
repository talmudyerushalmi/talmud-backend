import { Line, SubLine } from '../models/line.model';

/** A detected sugia block inside a Halacha, used by split composition and the admin UI. */
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
export function extractSugias(lines: Line[]): SugiaInfo[] {
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

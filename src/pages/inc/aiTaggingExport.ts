import { RawDraftContentState } from 'draft-js';
import {
  CategoryConnection,
  Line,
  RabbiMention,
  SubLine,
  SublineCategory,
  SublineComment,
} from '../models/line.model';
import { Mishna } from '../schemas/mishna.schema';
import { extractSugias, SugiaInfo } from './sugiaUtils';
import { findCategoryDef } from './taggingCategories';

/* ============================================================================
 *  Public shapes — what the controller returns and what the FE consumes
 * ==========================================================================*/

/**
 * Identifies a specific named sugya inside a chapter, by halacha id and the
 * sugya's 0-based index within that halacha's `extractSugias` result.
 * (Anonymous "intro" blocks are filtered out — see `buildSugyotForChapter`.)
 */
export interface SugyaRef {
  halacha: string;
  sugyaIndex: number;
}

/** One row in the checkbox-list UI the editor picks from. */
export interface SugyaListing extends SugyaRef {
  sugyaName: string;
  sublineCount: number;
  /** How many sublines in this sugya carry at least one annotation of any kind. */
  taggedSublineCount: number;
}

/** Category as emitted in the JSONL — enriched with human-readable labels. */
export interface ExportCategory {
  categoryId: string;
  /** Hebrew label from `taggingCategories.ts`. Falls back to the id if unknown. */
  label: string;
  labelEn: string;
  /** Connection list carried over from `SublineCategory.connections` verbatim. */
  connections: CategoryConnection[];
}

export interface ExportAnnotations {
  categories: ExportCategory[];
  rabbiMentions: RabbiMention[];
  comments: SublineComment[];
}

/** One JSONL record — one subline. */
export interface SublineExportRecord {
  tractate: string;
  chapter: string;
  halacha: string;
  sugyaName: string;
  /** 0-based sugya index within the halacha (matches `SugyaRef.sugyaIndex`). */
  sugyaIndex: number;
  /** 0-based subline position within THIS sugya. */
  positionInSugya: number;
  /** Total sublines in this sugya (same for every record in the sugya). */
  sugyaLength: number;
  /** `lineNumber` of the line this subline lives in (5-digit padded string). */
  lineNumber: string;
  /** 1-based subline index within the whole halacha (matches `SubLine.index`). */
  sublineIndex: number;
  text: string;
  /** Plain-text extraction of the halacha's anchoring Mishna (`richTextMishna`). */
  mishnaText: string;
  /** Omitted entirely when the export was requested with `includeTags: false`. */
  annotations?: ExportAnnotations;
}

/* ============================================================================
 *  buildSugyotForChapter — powers the checkbox-list GET
 * ==========================================================================*/

/**
 * Walks each mishna in the given chapter and returns one listing entry per
 * NAMED sugya (anonymous intro blocks are filtered out, matching the export
 * boundary the editor picked).
 *
 * `mishnaiot` is expected to be pre-sorted by `mishna` id (that's what
 * `MishnaRepository.getAllChapter` returns).
 */
export function buildSugyotForChapter(mishnaiot: Mishna[]): SugyaListing[] {
  const out: SugyaListing[] = [];
  for (const doc of mishnaiot) {
    const sugias = extractSugias(doc.lines ?? []);
    sugias.forEach((sugya, idx) => {
      // Skip the anonymous intro block — user chose "named sugyot only".
      if (!sugya.sugiaName) return;
      const sublines = collectSugyaSublines(doc.lines ?? [], sugya);
      out.push({
        halacha: doc.mishna,
        sugyaIndex: idx,
        sugyaName: sugya.sugiaName,
        sublineCount: sublines.length,
        taggedSublineCount: sublines.filter(hasAnyAnnotation).length,
      });
    });
  }
  return out;
}

/* ============================================================================
 *  buildExportGroups — powers the ZIP-of-JSONL-files POST
 * ==========================================================================*/

/**
 * A single sugya's worth of export data — becomes one `.jsonl` file inside the
 * ZIP the controller ships back.
 */
export interface SugyaExportGroup {
  ref: SugyaRef;
  halacha: string;
  sugyaName: string;
  /** All sublines in this sugya, in reading order (positionInSugya 0..N-1). */
  records: SublineExportRecord[];
}

/**
 * Groups sublines by sugya so the caller can emit one file per sugya, in the
 * order the editor picked. Refs that don't resolve (unknown halacha, out-of-
 * range sugyaIndex, anonymous block) are silently skipped rather than
 * throwing — an editor might export a pre-saved list after the source data
 * changed shape.
 */
export function buildExportGroups(
  tractate: string,
  chapter: string,
  mishnaiot: Mishna[],
  refs: SugyaRef[],
  includeTags: boolean,
): SugyaExportGroup[] {
  const byMishna = new Map<string, Mishna>();
  for (const doc of mishnaiot) byMishna.set(doc.mishna, doc);

  const groups: SugyaExportGroup[] = [];
  for (const ref of refs) {
    const doc = byMishna.get(ref.halacha);
    if (!doc) continue;

    const sugias = extractSugias(doc.lines ?? []);
    const sugya = sugias[ref.sugyaIndex];
    if (!sugya || !sugya.sugiaName) continue;

    const sublines = collectSugyaSublines(doc.lines ?? [], sugya);
    const mishnaText = richToPlainText(doc.richTextMishna);
    const records: SublineExportRecord[] = sublines.map((entry, positionInSugya) => ({
      tractate,
      chapter,
      halacha: doc.mishna,
      sugyaName: sugya.sugiaName,
      sugyaIndex: ref.sugyaIndex,
      positionInSugya,
      sugyaLength: sublines.length,
      lineNumber: entry.lineNumber,
      sublineIndex: entry.subline.index,
      text: entry.subline.text ?? '',
      mishnaText,
      ...(includeTags ? { annotations: enrichAnnotations(entry.subline) } : {}),
    }));

    groups.push({
      ref,
      halacha: doc.mishna,
      sugyaName: sugya.sugiaName,
      records,
    });
  }
  return groups;
}

/**
 * Serializes one group's records to JSONL text (one JSON object per line,
 * no trailing newline). Extracted so callers that don't need the ZIP wrapping
 * (e.g. future streaming endpoints, tests) can reuse the encoding.
 */
export function groupToJsonl(group: SugyaExportGroup): string {
  return group.records.map((r) => JSON.stringify(r)).join('\n');
}

/**
 * Produces a filesystem-safe filename for one sugya's `.jsonl`, embedding
 * enough context (halacha + sugya index + sugya name) that unzipped files
 * remain identifiable without opening them. Hebrew letters are preserved
 * — modern archive tools (macOS Archive Utility, Windows 10+, unzip) handle
 * UTF-8 file entries correctly.
 *
 * Example: `003_sugya-2_בבא-מציעא.jsonl`
 */
export function buildSugyaFilename(group: SugyaExportGroup): string {
  const slug = safeSlug(group.sugyaName) || 'unnamed';
  return `${group.halacha}_sugya-${group.ref.sugyaIndex}_${slug}.jsonl`;
}

/* ============================================================================
 *  Helpers
 * ==========================================================================*/

interface SublineWithLine {
  subline: SubLine;
  lineNumber: string;
}

/**
 * Flattens every subline that belongs to `sugya` — i.e. every subline of every
 * line in the sugya's `[firstLineIndex, firstLineIndex + lineCount)` range.
 */
function collectSugyaSublines(
  lines: Line[],
  sugya: SugiaInfo,
): SublineWithLine[] {
  const out: SublineWithLine[] = [];
  const end = Math.min(lines.length, sugya.firstLineIndex + sugya.lineCount);
  for (let i = sugya.firstLineIndex; i < end; i++) {
    const line = lines[i];
    const lineNumber = line.lineNumber ?? '';
    for (const subline of line.sublines ?? []) {
      out.push({ subline, lineNumber });
    }
  }
  return out;
}

function hasAnyAnnotation(entry: SublineWithLine): boolean {
  const s = entry.subline;
  // Pending AI suggestions aren't real annotations yet — don't count them.
  const approvedCategories = (s.categories ?? []).filter(
    (c) => c.status !== 'pending',
  );
  return (
    approvedCategories.length > 0 ||
    (s.rabbiMentions && s.rabbiMentions.length > 0) ||
    (s.comments && s.comments.length > 0)
  );
}

function enrichAnnotations(subline: SubLine): ExportAnnotations {
  return {
    // Exclude pending AI suggestions from exports — only approved tags ship.
    categories: (subline.categories ?? [])
      .filter((c) => c.status !== 'pending')
      .map(enrichCategory),
    rabbiMentions: subline.rabbiMentions ?? [],
    comments: subline.comments ?? [],
  };
}

function enrichCategory(cat: SublineCategory): ExportCategory {
  const def = findCategoryDef(cat.categoryId);
  return {
    categoryId: cat.categoryId,
    // Fall back to the id so the export never emits an empty label — makes
    // downstream tooling (and LLM prompts) more robust to taxonomy drift.
    label: def?.label ?? cat.categoryId,
    labelEn: def?.labelEn ?? cat.categoryId,
    connections: cat.connections ?? [],
  };
}

/**
 * Filesystem-safe slug preserving Hebrew letters and digits. Everything else
 * collapses to a single hyphen; leading/trailing hyphens are trimmed. Used to
 * turn a sugya name into a legible filename component.
 */
function safeSlug(s: string): string {
  return s
    .replace(/[^\p{L}\p{N}\-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extracts plain text from a Draft.js `RawDraftContentState` by joining every
 * block's `.text` with a newline. Draft.js's block-level styling isn't useful
 * for LLM prompts, so we discard everything except the text.
 */
function richToPlainText(raw: RawDraftContentState | null | undefined): string {
  if (!raw?.blocks?.length) return '';
  return raw.blocks
    .map((b) => b.text ?? '')
    .join('\n')
    .trim();
}

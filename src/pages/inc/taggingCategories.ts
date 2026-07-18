/**
 * Human-readable labels for the fixed tagging category taxonomy.
 *
 * IMPORTANT: this list must stay in sync with `TAGGING_CATEGORIES` in the FE
 * (`talmud-frontend/src/services/tagging.service.ts`). We duplicate rather than
 * import because BE and FE don't share code, but the taxonomy is small (< 25
 * entries) and rarely changes.
 *
 * The BE only needs the labels for one purpose today: enriching AI-tagging
 * export records so downstream LLMs get "היגד / Statement" instead of the
 * opaque `role_2` id.
 */

export interface TaggingCategoryDef {
  id: string;
  /** Hebrew display label (matches the FE `label` field). */
  label: string;
  /** English display label (matches the FE `labelEn` field). */
  labelEn: string;
}

export const TAGGING_CATEGORIES: TaggingCategoryDef[] = [
  { id: 'role_1', label: 'משנה', labelEn: 'Mishna' },
  { id: 'role_2', label: 'היגד', labelEn: 'Statement' },
  { id: 'role_3', label: 'ראיה', labelEn: 'Proof' },
  { id: 'role_4', label: 'פירוש', labelEn: 'Commentary' },
  { id: 'role_5', label: 'סיוע', labelEn: 'Support' },
  { id: 'role_6', label: 'שאלה', labelEn: 'Question' },
  { id: 'role_7', label: 'תשובה', labelEn: 'Answer' },
  { id: 'role_8', label: 'קושיה', labelEn: 'Objection' },
  { id: 'role_9', label: 'תירוץ', labelEn: 'Resolution' },
  { id: 'role_10', label: 'פסיקה', labelEn: 'Ruling' },
  { id: 'role_11', label: 'דחייה', labelEn: 'Rejection' },
  { id: 'role_12', label: 'הערה', labelEn: 'Note' },
  { id: 'role_13', label: 'הדגמה', labelEn: 'Illustration' },
  { id: 'role_14', label: 'מעשה', labelEn: 'Narrative' },
  { id: 'role_15', label: 'סיכום', labelEn: 'Summary' },
  { id: 'role_16', label: 'התאמה', labelEn: 'Adaptation' },
  { id: 'role_17', label: 'הגהה', labelEn: 'Emendation' },
  { id: 'role_18', label: 'המשך', labelEn: 'Continuation' },
  { id: 'role_28', label: 'שונות', labelEn: 'Miscellaneous' },
];

const BY_ID = new Map<string, TaggingCategoryDef>(
  TAGGING_CATEGORIES.map((c) => [c.id, c]),
);

/**
 * Look up a category definition by its id. Returns `undefined` for unknown ids
 * so callers can decide whether to surface a warning, fall back to the raw id,
 * or drop the entry.
 */
export function findCategoryDef(id: string): TaggingCategoryDef | undefined {
  return BY_ID.get(id);
}

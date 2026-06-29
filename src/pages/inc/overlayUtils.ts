import { HalachaOperation } from '../schemas/halacha-override.schema';
import { unwrapMongoose } from './mongooseUtils';

/**
 * Reference shape used in the tractate doc's `chapters[].mishnaiot` array.
 * We add an optional `unifiedWithAll` field so the FE can render combined labels
 * like "ה-ו" or "ה-ו-ז" without the BE knowing about Hebrew letters.
 */
export interface OverlaidMishnaRef {
  id: string;
  mishna: string;
  mishnaRef?: any;
  /** When set, this entry is the first source of a unify and `unifiedWithAll` lists ALL
   *  sources in chapter order (length 2 or 3). The first element equals `mishna`. */
  unifiedWithAll?: string[];
}

/** Apply unify overlays to one chapter's mishnaiot list (splits don't affect it). */
export function overlayMishnaList(
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

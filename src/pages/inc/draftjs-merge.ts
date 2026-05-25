import { RawDraftContentState } from 'draft-js';

/**
 * Concatenates two Draft.js `RawDraftContentState` documents into one.
 *
 * Draft.js identifies blocks by a unique `key` (per content state) and entities
 * by string keys in `entityMap` referenced from blocks via `entityRanges[].key`.
 * Naively merging two states risks key collisions (same block key in both, or
 * "0","1" entity keys reused in both). This helper does the bookkeeping:
 *
 *   - Entities from `b` are reassigned numeric keys offset past `a`'s max,
 *     and every `entityRanges[].key` in `b`'s blocks is rewritten to match.
 *   - Block keys from `b` are regenerated whenever they collide with a key in `a`.
 *
 * Inline styles are local to a block and never reference other state, so they
 * pass through unchanged.
 *
 * Null/empty inputs are tolerated — we treat them as empty content states.
 * If both inputs are null, the result is `{ blocks: [], entityMap: {} }`.
 */
export function concatRichText(
  a: RawDraftContentState | null | undefined,
  b: RawDraftContentState | null | undefined,
): RawDraftContentState {
  const aBlocks = a?.blocks ?? [];
  const bBlocks = b?.blocks ?? [];
  const aEntityMap = a?.entityMap ?? {};
  const bEntityMap = b?.entityMap ?? {};

  // 1. Compute the offset for b's entity keys.
  //    Draft.js entity keys are numeric-string ("0", "1", ...) by convention; we tolerate
  //    non-numeric keys by counting them in the offset too (offset = total entity count in a).
  const aEntityCount = Object.keys(aEntityMap).length;

  // 2. Build a key map for b's entityMap: oldKey -> newKey (numeric, contiguous after a's).
  const bEntityKeys = Object.keys(bEntityMap);
  const bKeyRemap = new Map<string, string>();
  bEntityKeys.forEach((oldKey, i) => {
    bKeyRemap.set(oldKey, String(aEntityCount + i));
  });

  // 3. Compose entityMap.
  const mergedEntityMap: RawDraftContentState['entityMap'] = { ...aEntityMap };
  for (const [oldKey, newKey] of bKeyRemap.entries()) {
    mergedEntityMap[newKey] = bEntityMap[oldKey];
  }

  // 4. Ensure block keys don't collide. We only regenerate b's keys on collision so that
  //    `a` keeps its original keys (less churn).
  const usedBlockKeys = new Set(aBlocks.map((blk) => blk.key));
  const remappedBBlocks = bBlocks.map((blk) => {
    let key = blk.key;
    while (usedBlockKeys.has(key)) {
      key = generateBlockKey();
    }
    usedBlockKeys.add(key);

    // Rewrite entityRanges to point at the remapped entity keys.
    const entityRanges = (blk.entityRanges ?? []).map((er) => {
      const oldKey = String(er.key);
      const newKey = bKeyRemap.get(oldKey);
      return {
        ...er,
        // Draft.js types `er.key` as number — preserve numeric type when possible.
        key: newKey !== undefined && !Number.isNaN(Number(newKey))
          ? Number(newKey)
          : er.key,
      };
    });

    return { ...blk, key, entityRanges };
  });

  return {
    blocks: [...aBlocks, ...remappedBBlocks],
    entityMap: mergedEntityMap,
  };
}

/**
 * Draft.js uses 5-character base36 keys (e.g. "9k3pq"). We use the same shape so
 * downstream consumers can't tell composed-state keys apart from native ones.
 */
function generateBlockKey(): string {
  return Math.random().toString(36).substring(2, 7).padEnd(5, '0');
}

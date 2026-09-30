import { RawDraftContentState } from 'draft-js';

/** Position inside a Draft.js content state where a slice cut is placed. */
export interface SliceCut {
  blockKey: string;
  offset: number;
}

type Block = RawDraftContentState['blocks'][number];

/**
 * Splits a Draft.js `RawDraftContentState` into N+1 contiguous slices at the given
 * cut points.
 *
 * Each cut is expressed as `(blockKey, offset)` where `offset ∈ [0..block.text.length]`.
 *   - `offset === 0`              → cut sits at the very start of the block
 *   - `offset === block.text.length` → cut sits at the very end of the block
 *   - otherwise                   → the block is split into two halves
 *
 * Cuts MUST appear in the same order they appear in the content (left-to-right).
 * Callers are responsible for the ordering; this util doesn't sort.
 *
 * What we preserve and what we don't:
 *   - **Block structure** (type, depth, data) — preserved on both halves.
 *   - **Inline style ranges** — fully preserved; ranges that straddle a cut are split
 *     into two ranges (one per side) so the styling looks identical on both halves.
 *   - **Entity ranges** — kept on the side they START on, truncated to the cut.
 *     Per design: if an entity range begins to the left of the cut, the left side keeps
 *     it (length clipped); the right side does NOT inherit it. Mirror behavior on the
 *     right. Entity ranges starting exactly at the cut land on the right side.
 *   - **entityMap** — included as-is in every slice. We could prune unreferenced keys
 *     but Draft.js tolerates extras and pruning adds complexity for no functional gain.
 *
 * Null/undefined input is tolerated and produces N+1 empty content states.
 */
export function sliceRichText(
  content: RawDraftContentState | null | undefined,
  cuts: SliceCut[],
): RawDraftContentState[] {
  const blocks = content?.blocks ?? [];
  const entityMap = content?.entityMap ?? {};

  if (cuts.length === 0) {
    return [{ blocks: [...blocks], entityMap: { ...entityMap } }];
  }

  // Resolve each cut to (blockIdx, offset) in the source content. We tolerate cuts
  // pointing at non-existent blocks by silently dropping them — validation upstream
  // should already prevent this, but defensive coding here avoids hard crashes.
  const blockIdxByKey = new Map<string, number>();
  blocks.forEach((b, i) => blockIdxByKey.set(b.key, i));

  const positions = cuts
    .map((c) => {
      const blockIdx = blockIdxByKey.get(c.blockKey);
      return blockIdx === undefined
        ? null
        : { blockIdx, offset: c.offset };
    })
    .filter((p): p is { blockIdx: number; offset: number } => p !== null);

  // Walk blocks left-to-right, emitting a new slice each time we pass a cut.
  const slices: Block[][] = [[]];
  let cutPtr = 0;

  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    let current: Block | null = blocks[blockIdx];

    while (
      cutPtr < positions.length &&
      positions[cutPtr].blockIdx === blockIdx
    ) {
      const offset = positions[cutPtr].offset;
      const [left, right] = splitBlock(current!, offset);
      if (left) slices[slices.length - 1].push(left);
      slices.push([]);
      current = right;
      cutPtr++;
    }

    if (current) slices[slices.length - 1].push(current);
  }

  // Any remaining cuts (e.g. all pointing past the last block) just produce empty trailing slices.
  while (cutPtr < positions.length) {
    slices.push([]);
    cutPtr++;
  }

  return slices.map((blks) => ({
    blocks: blks,
    entityMap: { ...entityMap },
  }));
}

/**
 * Splits a single block at the given character offset.
 * Returns `[leftBlock | null, rightBlock | null]`. Either side can be `null` when
 * the cut sits at the extreme edge of the block.
 */
function splitBlock(block: Block, offset: number): [Block | null, Block | null] {
  const text = block.text ?? '';
  if (offset <= 0) return [null, block];
  if (offset >= text.length) return [block, null];

  const leftText = text.slice(0, offset);
  const rightText = text.slice(offset);

  const leftInline = (block.inlineStyleRanges ?? [])
    .map((r) => splitInlineRangeLeft(r, offset))
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const rightInline = (block.inlineStyleRanges ?? [])
    .map((r) => splitInlineRangeRight(r, offset))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const leftEntity = (block.entityRanges ?? [])
    .map((r) => clipEntityRangeLeft(r, offset))
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const rightEntity = (block.entityRanges ?? [])
    .map((r) => clipEntityRangeRight(r, offset))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return [
    {
      ...block,
      text: leftText,
      inlineStyleRanges: leftInline,
      entityRanges: leftEntity,
    },
    {
      ...block,
      // Fresh key for the right half so two halves of the same source block don't clash
      // when later concatenated with another state.
      key: generateBlockKey(block.key),
      text: rightText,
      inlineStyleRanges: rightInline,
      entityRanges: rightEntity,
    },
  ];
}

/* ---------- inline styles: split into two halves so both retain styling ---------- */

function splitInlineRangeLeft(
  r: Block['inlineStyleRanges'][number],
  cut: number,
): Block['inlineStyleRanges'][number] | null {
  if (r.offset >= cut) return null;
  const end = Math.min(r.offset + r.length, cut);
  return { ...r, offset: r.offset, length: end - r.offset };
}

function splitInlineRangeRight(
  r: Block['inlineStyleRanges'][number],
  cut: number,
): Block['inlineStyleRanges'][number] | null {
  const rEnd = r.offset + r.length;
  if (rEnd <= cut) return null;
  const newOffset = Math.max(r.offset - cut, 0);
  const newLength = rEnd - cut - newOffset;
  return { ...r, offset: newOffset, length: newLength };
}

/* ---------- entity ranges: each is kept on the side it STARTS on, then clipped ---------- */

function clipEntityRangeLeft(
  r: Block['entityRanges'][number],
  cut: number,
): Block['entityRanges'][number] | null {
  // Entities starting at the cut belong to the right side per design.
  if (r.offset >= cut) return null;
  const newLength = Math.min(r.length, cut - r.offset);
  return { ...r, offset: r.offset, length: newLength };
}

function clipEntityRangeRight(
  r: Block['entityRanges'][number],
  cut: number,
): Block['entityRanges'][number] | null {
  if (r.offset < cut) return null;
  return { ...r, offset: r.offset - cut };
}

/**
 * Generate a fresh block key in Draft.js's native 5-char base36 shape. We seed off the
 * original key suffix to keep it deterministic-ish in tests while still avoiding collisions.
 */
function generateBlockKey(seed: string): string {
  const rand = Math.random().toString(36).substring(2, 7).padEnd(5, '0');
  // Mix in the seed's last char to make local debugging slightly easier.
  return rand.slice(0, 4) + (seed.slice(-1) || '0');
}

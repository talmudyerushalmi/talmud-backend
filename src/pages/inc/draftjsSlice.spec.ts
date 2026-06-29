import { RawDraftContentState } from 'draft-js';
import { sliceRichText } from './draftjsSlice';

type Block = RawDraftContentState['blocks'][number];
type InlineRange = Block['inlineStyleRanges'][number];
type EntityRange = Block['entityRanges'][number];

const block = (
  key: string,
  text: string,
  inline: InlineRange[] = [],
  entity: EntityRange[] = [],
): Block => ({
  key,
  type: 'unstyled',
  text,
  depth: 0,
  inlineStyleRanges: inline,
  entityRanges: entity,
  data: {},
});

describe('sliceRichText', () => {
  it('returns a single slice when no cuts are provided', () => {
    const content: RawDraftContentState = {
      blocks: [block('b1', 'hello')],
      entityMap: {},
    };
    const slices = sliceRichText(content, []);
    expect(slices).toHaveLength(1);
    expect(slices[0].blocks).toEqual(content.blocks);
  });

  it('drops cuts pointing at non-existent blocks (defensive fallback)', () => {
    // Empty content + cuts pointing at unknown keys → cuts are silently ignored.
    // Upstream validation should prevent this, but the slicer must not crash.
    const slices = sliceRichText(null, [
      { blockKey: 'x', offset: 0 },
      { blockKey: 'y', offset: 0 },
    ]);
    expect(slices).toHaveLength(1);
    expect(slices[0].blocks).toEqual([]);
  });

  it('cuts AT a block boundary (offset=0) puts the block on the right slice', () => {
    const content: RawDraftContentState = {
      blocks: [block('a', 'aa'), block('b', 'bb'), block('c', 'cc')],
      entityMap: {},
    };
    const slices = sliceRichText(content, [{ blockKey: 'b', offset: 0 }]);
    expect(slices).toHaveLength(2);
    expect(slices[0].blocks.map((b) => b.text)).toEqual(['aa']);
    expect(slices[1].blocks.map((b) => b.text)).toEqual(['bb', 'cc']);
  });

  it('cuts AT block end (offset=text.length) puts the block on the left slice', () => {
    const content: RawDraftContentState = {
      blocks: [block('a', 'aa'), block('b', 'bb'), block('c', 'cc')],
      entityMap: {},
    };
    const slices = sliceRichText(content, [
      { blockKey: 'b', offset: 'bb'.length },
    ]);
    expect(slices).toHaveLength(2);
    expect(slices[0].blocks.map((b) => b.text)).toEqual(['aa', 'bb']);
    expect(slices[1].blocks.map((b) => b.text)).toEqual(['cc']);
  });

  it('cuts MID-block splits that block into two halves with the correct text', () => {
    const content: RawDraftContentState = {
      blocks: [block('only', 'helloworld')],
      entityMap: {},
    };
    const slices = sliceRichText(content, [{ blockKey: 'only', offset: 5 }]);
    expect(slices).toHaveLength(2);
    expect(slices[0].blocks[0].text).toBe('hello');
    expect(slices[1].blocks[0].text).toBe('world');
    // Keys differ on the right so future composition doesn't collide.
    expect(slices[1].blocks[0].key).not.toBe('only');
  });

  it('mid-block cut splits a straddling inline style range into two clean halves', () => {
    // "hellOworld" with BOLD covering [3, 8) — straddles a cut at 5.
    const content: RawDraftContentState = {
      blocks: [
        block('only', 'helloworld', [{ style: 'BOLD', offset: 3, length: 5 }]),
      ],
      entityMap: {},
    };
    const slices = sliceRichText(content, [{ blockKey: 'only', offset: 5 }]);
    // Left "hello": BOLD remains at offset 3, length 2 (chars 3..4)
    expect(slices[0].blocks[0].inlineStyleRanges).toEqual([
      { style: 'BOLD', offset: 3, length: 2 },
    ]);
    // Right "world": BOLD relocates to offset 0, length 3 (chars 5..7)
    expect(slices[1].blocks[0].inlineStyleRanges).toEqual([
      { style: 'BOLD', offset: 0, length: 3 },
    ]);
  });

  it('keeps an entity on the side it STARTS on, clipped to the cut', () => {
    // Entity at [3, 8) — starts before cut at 5. Should stay on LEFT, length clipped to 2.
    const content: RawDraftContentState = {
      blocks: [
        block(
          'only',
          'helloworld',
          [],
          [{ key: 0, offset: 3, length: 5 }],
        ),
      ],
      entityMap: {
        '0': { type: 'MENTION', mutability: 'IMMUTABLE', data: { id: 'x' } },
      },
    };
    const slices = sliceRichText(content, [{ blockKey: 'only', offset: 5 }]);
    expect(slices[0].blocks[0].entityRanges).toEqual([
      { key: 0, offset: 3, length: 2 },
    ]);
    expect(slices[1].blocks[0].entityRanges).toEqual([]);
  });

  it('entity that STARTS at or after the cut lands on the right side, offset shifted', () => {
    // Entity at [6, 9) — starts AFTER cut at 5. Should stay on RIGHT, offset 6-5=1.
    const content: RawDraftContentState = {
      blocks: [
        block(
          'only',
          'helloworld',
          [],
          [{ key: 0, offset: 6, length: 3 }],
        ),
      ],
      entityMap: {
        '0': { type: 'MENTION', mutability: 'IMMUTABLE', data: { id: 'x' } },
      },
    };
    const slices = sliceRichText(content, [{ blockKey: 'only', offset: 5 }]);
    expect(slices[0].blocks[0].entityRanges).toEqual([]);
    expect(slices[1].blocks[0].entityRanges).toEqual([
      { key: 0, offset: 1, length: 3 },
    ]);
  });

  it('supports multiple cuts producing three contiguous slices', () => {
    const content: RawDraftContentState = {
      blocks: [
        block('a', 'AA'),
        block('b', 'BBBB'),
        block('c', 'CC'),
        block('d', 'DD'),
      ],
      entityMap: {},
    };
    // Two cuts: at start of 'b' and mid-block 'c' at offset 1.
    const slices = sliceRichText(content, [
      { blockKey: 'b', offset: 0 },
      { blockKey: 'c', offset: 1 },
    ]);
    expect(slices).toHaveLength(3);
    expect(slices[0].blocks.map((b) => b.text)).toEqual(['AA']);
    expect(slices[1].blocks.map((b) => b.text)).toEqual(['BBBB', 'C']);
    expect(slices[2].blocks.map((b) => b.text)).toEqual(['C', 'DD']);
  });

  it('includes the entityMap in every slice', () => {
    const content: RawDraftContentState = {
      blocks: [block('a', 'AA')],
      entityMap: {
        '0': { type: 'X', mutability: 'IMMUTABLE', data: {} },
      },
    };
    const slices = sliceRichText(content, [{ blockKey: 'a', offset: 1 }]);
    expect(slices[0].entityMap).toEqual(content.entityMap);
    expect(slices[1].entityMap).toEqual(content.entityMap);
  });
});

import { RawDraftContentState } from 'draft-js';
import { concatRichText } from './draftjs-merge';

const block = (
  key: string,
  text: string,
  entityRanges: { key: number; length: number; offset: number }[] = [],
) => ({
  key,
  type: 'unstyled' as const,
  text,
  depth: 0,
  inlineStyleRanges: [],
  entityRanges,
  data: {},
});

describe('concatRichText', () => {
  it('returns an empty state when both inputs are null', () => {
    const out = concatRichText(null, null);
    expect(out).toEqual({ blocks: [], entityMap: {} });
  });

  it('returns a clone of `a` when `b` is empty', () => {
    const a: RawDraftContentState = {
      blocks: [block('aaa11', 'hello')],
      entityMap: {},
    };
    const out = concatRichText(a, null);
    expect(out.blocks).toEqual(a.blocks);
    expect(out.entityMap).toEqual({});
  });

  it('returns a clone of `b` when `a` is empty', () => {
    const b: RawDraftContentState = {
      blocks: [block('bbb22', 'world')],
      entityMap: {},
    };
    const out = concatRichText(null, b);
    expect(out.blocks).toEqual(b.blocks);
  });

  it('concatenates block arrays in order', () => {
    const a: RawDraftContentState = {
      blocks: [block('a1', 'first'), block('a2', 'second')],
      entityMap: {},
    };
    const b: RawDraftContentState = {
      blocks: [block('b1', 'third'), block('b2', 'fourth')],
      entityMap: {},
    };
    const out = concatRichText(a, b);
    expect(out.blocks.map((blk) => blk.text)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
    ]);
    // a's keys are preserved unchanged
    expect(out.blocks[0].key).toBe('a1');
    expect(out.blocks[1].key).toBe('a2');
  });

  it('regenerates b-block keys that collide with a', () => {
    const a: RawDraftContentState = {
      blocks: [block('same1', 'A')],
      entityMap: {},
    };
    const b: RawDraftContentState = {
      // Same key as a — must be regenerated.
      blocks: [block('same1', 'B')],
      entityMap: {},
    };
    const out = concatRichText(a, b);
    expect(out.blocks[0].key).toBe('same1');
    expect(out.blocks[1].key).not.toBe('same1');
    expect(out.blocks[1].text).toBe('B');
  });

  it('offsets b entity keys past a and rewrites entityRanges accordingly', () => {
    const a: RawDraftContentState = {
      blocks: [block('a1', 'X', [{ key: 0, length: 1, offset: 0 }])],
      entityMap: {
        '0': { type: 'A_ENTITY', mutability: 'IMMUTABLE', data: { id: 'a' } },
      },
    };
    const b: RawDraftContentState = {
      blocks: [
        block('b1', 'Y', [{ key: 0, length: 1, offset: 0 }]),
        block('b2', 'Z', [{ key: 1, length: 1, offset: 0 }]),
      ],
      entityMap: {
        '0': { type: 'B0', mutability: 'IMMUTABLE', data: { id: 'b0' } },
        '1': { type: 'B1', mutability: 'IMMUTABLE', data: { id: 'b1' } },
      },
    };
    const out = concatRichText(a, b);

    // a's "0" entity stays.
    expect(out.entityMap['0']).toEqual(a.entityMap['0']);
    // b's "0" became "1"; b's "1" became "2".
    expect(out.entityMap['1']).toEqual(b.entityMap['0']);
    expect(out.entityMap['2']).toEqual(b.entityMap['1']);

    // a's block keeps key=0; b's blocks' entityRanges are remapped.
    expect(out.blocks[0].entityRanges[0].key).toBe(0);
    expect(out.blocks[1].entityRanges[0].key).toBe(1);
    expect(out.blocks[2].entityRanges[0].key).toBe(2);
  });

  it('preserves inline style ranges on both sides verbatim', () => {
    const a: RawDraftContentState = {
      blocks: [
        {
          ...block('a1', 'AA'),
          inlineStyleRanges: [{ style: 'BOLD', length: 2, offset: 0 }],
        },
      ],
      entityMap: {},
    };
    const b: RawDraftContentState = {
      blocks: [
        {
          ...block('b1', 'BB'),
          inlineStyleRanges: [{ style: 'ITALIC', length: 2, offset: 0 }],
        },
      ],
      entityMap: {},
    };
    const out = concatRichText(a, b);
    expect(out.blocks[0].inlineStyleRanges).toEqual([
      { style: 'BOLD', length: 2, offset: 0 },
    ]);
    expect(out.blocks[1].inlineStyleRanges).toEqual([
      { style: 'ITALIC', length: 2, offset: 0 },
    ]);
  });
});

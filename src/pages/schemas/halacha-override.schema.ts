import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

/**
 * A position inside a Mishna's `richTextMishna` (Draft.js content), identifying
 * where to slice the rich text when an editor splits a Halacha into mini-Halachas.
 *
 * Both fields refer to native Draft.js identifiers on `richTextMishna`:
 *   - `blockKey`: the `key` of the content block containing the cut
 *   - `offset`: character offset within that block (0..block.text.length)
 */
export interface MishnaCut {
  blockKey: string;
  offset: number;
}

/**
 * Discriminated union persisted under `operations`.
 *
 * `unify`:
 *   2 or 3 ADJACENT source Halachas presented as a single Halacha. URL canonicalizes
 *   to `sources[0]`; a request for any non-first source returns a redirect signal.
 *
 * `split`:
 *   One source Halacha is presented as 2 or 3 mini-Halachas. URL stays unchanged
 *   (`source`); the active mini-part is selected by a `?part` query string.
 *
 *   - `sugiaBoundaries`: indices (1-based-in-sugia-order, inclusive) at which a new
 *     part begins. e.g. for a source with 4 sugias and `sugiaBoundaries: [2]`,
 *     part 1 owns sugias[0..1] and part 2 owns sugias[2..3]. Length is 1 or 2.
 *   - `mishnaCuts`: positions in `richTextMishna` separating the Mishna text between
 *     parts. Length MUST equal `sugiaBoundaries.length`. Slices are taken in order:
 *     part 1 = [start .. mishnaCuts[0]), part 2 = [mishnaCuts[0] .. mishnaCuts[1]), ...
 *
 * The two arrays are aligned by index — same number of cuts as sugia boundaries —
 * so each split point is consistent across both the Mishna's rich text and the Sugiot list.
 */
export type HalachaOperation =
  | { kind: 'unify'; sources: string[] }
  | {
      kind: 'split';
      source: string;
      sugiaBoundaries: number[];
      mishnaCuts: MishnaCut[];
    };

/**
 * Per-(tractate, chapter) overlay describing how the chapter's Halachas should
 * be composed for the read path. Absence of a document = no overrides = legacy behavior.
 *
 * Operations are stored as `Mixed` because Mongoose discriminators on subdocuments
 * are awkward; structural validation lives in the DTO layer and semantic validation
 * (adjacency, coverage, boundaries within range) lives in the service.
 */
@Schema({ collection: 'halacha_overrides', minimize: false, timestamps: true })
export class HalachaOverride extends Document {
  @Prop({ index: true })
  tractate: string;

  @Prop({ index: true })
  chapter: string;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  operations: HalachaOperation[];

  @Prop()
  updatedBy?: string;
}

export const HalachaOverrideSchema = SchemaFactory.createForClass(HalachaOverride);

HalachaOverrideSchema.index({ tractate: 1, chapter: 1 }, { unique: true });

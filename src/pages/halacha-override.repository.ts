import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HalachaOperation, HalachaOverride } from './schemas/halacha-override.schema';

@Injectable()
export class HalachaOverrideRepository {
  constructor(
    @InjectModel(HalachaOverride.name)
    private halachaOverrideModel: Model<HalachaOverride>,
  ) {}

  async findByChapter(tractate: string, chapter: string): Promise<HalachaOverride | null> {
    return this.halachaOverrideModel.findOne({ tractate, chapter }).lean<HalachaOverride>().exec();
  }

  /**
   * Fetch every override for a tractate in a single query. Used by the tractate-level
   * nav-list overlay so we don't have to issue N queries (one per chapter) per fetch.
   */
  async findAllForTractate(tractate: string): Promise<HalachaOverride[]> {
    return this.halachaOverrideModel
      .find({ tractate })
      .lean<HalachaOverride[]>()
      .exec();
  }

  /**
   * Upsert by (tractate, chapter). `operations` is the FULL desired list — empty array is allowed
   * and means "chapter has no overrides" (we keep the doc for `updatedBy`/`updatedAt` audit;
   * use `deleteByChapter` to fully revert). `updatedAt` / `createdAt` are auto-managed by
   * Mongoose via `timestamps: true` on the schema.
   */
  async upsert(
    tractate: string,
    chapter: string,
    operations: HalachaOperation[],
    updatedBy?: string,
  ): Promise<HalachaOverride> {
    return this.halachaOverrideModel
      .findOneAndUpdate(
        { tractate, chapter },
        {
          $set: {
            tractate,
            chapter,
            operations,
            updatedBy,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean<HalachaOverride>()
      .exec();
  }

  async deleteByChapter(tractate: string, chapter: string): Promise<{ deleted: boolean }> {
    const res = await this.halachaOverrideModel.deleteOne({ tractate, chapter }).exec();
    return { deleted: (res.deletedCount ?? 0) > 0 };
  }
}

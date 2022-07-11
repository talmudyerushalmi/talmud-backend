import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryWithHelpers } from 'mongoose';
import { Related } from './schemas/related.schema';

@Injectable()
export class RelatedRepository {
  constructor(@InjectModel(Related.name) private relatedModel: Model<Related>) {}

  getGUID(tractate: string, chapter: string): string {
    return `${tractate}_${chapter}`;
  }
  find(
    tractate: string,
    chapter: string,
  ): QueryWithHelpers<Related, any> {
    const guid = this.getGUID(tractate, chapter)
    return this.relatedModel.findOne({guid});
  }




}

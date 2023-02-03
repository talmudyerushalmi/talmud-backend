import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manuscripts } from './schemas/manuscripts.schema';

@Injectable()
export class ManuscriptsRepository {
  constructor(
    @InjectModel(Manuscripts.name)
    private manuscriptModel: Model<Manuscripts>,
  ) {}

  async getAllManuscripts(): Promise<Manuscripts[]> {
    return this.manuscriptModel.find();
  }
}

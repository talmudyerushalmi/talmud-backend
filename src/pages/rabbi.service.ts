import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rabbi } from './schemas/rabbi.schema';

@Injectable()
export class RabbiService {
  constructor(
    @InjectModel(Rabbi.name) private rabbiModel: Model<Rabbi>,
  ) {}

  async findAll(): Promise<Rabbi[]> {
    return this.rabbiModel.find().sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<Rabbi | null> {
    return this.rabbiModel.findById(id).exec();
  }
}

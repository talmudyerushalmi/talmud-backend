import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DafAmudMapping,
  DafAmudMappingDocument,
} from './schemas/daf-amud-mapping.schema';

@Injectable()
export class DafAmudMappingRepository {
  constructor(
    @InjectModel(DafAmudMapping.name)
    private dafAmudMappingModel: Model<DafAmudMappingDocument>,
  ) {}

  /**
   * Find mapping by tractate, daf, and amud
   * Used when user selects Daf+Amud to get the corresponding chapter/halacha
   */
  async findByDafAmud(
    tractate: string,
    daf: string,
    amud: string,
  ): Promise<DafAmudMapping | null> {
    return this.dafAmudMappingModel
      .findOne({ tractate, daf, amud })
      .exec();
  }

  /**
   * Get all unique Dafs for a tractate
   * Used to populate the Daf dropdown
   * Returns: Array of unique daf values (e.g., ['ב', 'ג', 'ד'...])
   */
  async getAllDafsForTractate(tractate: string): Promise<string[]> {
    return this.dafAmudMappingModel
      .distinct('daf', { tractate })
      .exec();
  }

  /**
   * Get all Amudim for a specific Daf within a tractate
   * Used to populate the Amud dropdown when a Daf is selected
   * Returns: Array of amud values (e.g., ['א', 'ב'])
   */
  async getAmudimsForDaf(tractate: string, daf: string): Promise<string[]> {
    return this.dafAmudMappingModel
      .distinct('amud', { tractate, daf })
      .exec();
  }

  /**
   * Bulk insert mappings
   */
  async insertMany(mappings: Partial<DafAmudMapping>[]): Promise<void> {
    await this.dafAmudMappingModel.insertMany(mappings);
  }

  /**
   * Delete all mappings
   */
  async deleteAll(): Promise<void> {
    await this.dafAmudMappingModel.deleteMany({}).exec();
  }

  /**
   * Count all mappings
   */
  async count(): Promise<number> {
    return this.dafAmudMappingModel.countDocuments().exec();
  }
}

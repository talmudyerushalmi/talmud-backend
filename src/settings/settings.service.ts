import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import * as fs from 'fs';
import { CsvParser } from 'nest-csv-parser';
import { Settings } from './schemas/settings.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AddCompositionDto } from './dto/add.compositionDto';
import { synopsisList } from '../pages/inc/tractates.synopsis';

class Entity {}

@Console()
@Injectable()
export class SettingsService {
  constructor(
    private csvParser: CsvParser,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  async getSettings(settingsID: string): Promise<any> {
    const s = await this.settingsModel.findOne({ id: settingsID });
    if (s) {
      return s.settings;
    } else {
      return null;
    }
  }

  getSynopsisList(): typeof synopsisList {
    return synopsisList;
  }

  async addComposition(
    newItem: AddCompositionDto,
  ): Promise<Settings> {
    const compositions = await this.getSettings("compositions");
    if (compositions.find(c => c.title === newItem.title)) {
      return Promise.resolve(compositions)
    }
    return this.settingsModel.findOneAndUpdate(
      { id: "compositions" } as FilterQuery<Settings>,
      { $push: { settings: newItem } } as UpdateQuery<Settings>,
    );
  }

  @Command({
    command: 'import:settings <settingsID> <filename>',
    description: 'Import settings',
  })
  async importSettings(settingsID: string, filename: string): Promise<void> {
    const stream = fs.createReadStream(filename);
    const excerpts = await this.csvParser.parse(stream, Entity, null, null, {
      strict: true,
      separator: ',',
    });

    const settings: any = [];
    const settingsDoc = await this.settingsModel.findOne({ id: settingsID });
    for (const excerpt of excerpts.list) {
      settings.push(excerpt);
    }
    if (settingsDoc) {
      await settingsDoc.updateOne({ settings });
    } else {
      const newDoc = new this.settingsModel({ id: settingsID, settings });
      await newDoc.save();
    }
  }
}

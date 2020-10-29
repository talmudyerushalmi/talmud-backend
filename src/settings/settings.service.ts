import { Injectable } from '@nestjs/common';
import { Command,Console} from 'nestjs-console';
import * as fs from 'fs';
import { CsvParser } from 'nest-csv-parser';
import { Settings, SettingsSchema } from './schemas/settings.schema';
import { DocumentQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

class Entity {

}

@Console()
@Injectable()
export class SettingsService {

    constructor(
        private csvParser: CsvParser,
        @InjectModel(Settings.name) private settingsModel: Model<Settings>
    ){}

    getSettings(settingsID:string): DocumentQuery<Settings,Settings> {
        return this.settingsModel.findOne({id:settingsID});
    }


   
    @Command({
        command: 'import:settings <settingsID> <filename>',
        description: 'Import settings',
      })
      async importSettings(settingsID: string, filename: string): Promise<void> {
          const stream = fs.createReadStream(filename)
          const excerpts = await this.csvParser.parse(stream, Entity, null, null,{ strict: true, separator: ',' })
       
          const settings = [];
          const settingsDoc = await this.settingsModel.findOne({id:settingsID});
          for (const excerpt of excerpts.list) {
              settings.push(excerpt);
          }
          if (settingsDoc) {
            await settingsDoc.updateOne({settings});
          } else {
              const newDoc = new this.settingsModel({id:settingsID, settings});
              await newDoc.save();
          }
       
      }
    
}

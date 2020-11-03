import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser';
import { ImportService } from './import.service';
import { PagesModule } from '../pages/pages.module';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsModule } from 'src/settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';

@Module({
  imports: [PagesModule, CsvModule, SettingsModule,
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),],
  providers: [ImportService, SettingsService],
})
export class ImportModule {}

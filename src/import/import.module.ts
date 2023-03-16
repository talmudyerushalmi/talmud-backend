import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser';
import { ImportService } from './import.service';
import { PagesModule } from '../pages/pages.module';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsModule } from 'src/settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from 'src/settings/schemas/settings.schema';
import { ListService } from './list.service';
import { NormalizeService } from './normalize.service';
import { LineService } from 'src/pages/line.service';
import { Tractate, TractateSchema } from 'src/pages/schemas/tractate.schema';
import { Mishna, MishnaSchema } from 'src/pages/schemas/mishna.schema';

@Module({
  imports: [
    PagesModule,
    CsvModule,
    SettingsModule,
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
      { name: Tractate.name, schema: TractateSchema },
      { name: Mishna.name, schema: MishnaSchema },
    ]),
  ],
  providers: [
    ImportService,
    SettingsService,
    ListService,
    NormalizeService,
    LineService,
  ],
})
export class ImportModule {}

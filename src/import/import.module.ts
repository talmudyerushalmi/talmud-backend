import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser';
import { ImportService } from './import.service';
import { PagesModule } from '../pages/pages.module';
import { SettingsService } from '../settings/settings.service';
import { SettingsModule } from '../settings/settings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from '../settings/schemas/settings.schema';
import { ListService } from './list.service';
import { NormalizeService } from './normalize.service';
import { ParallelService } from '../pages/parallel.service';
import { Tractate, TractateSchema } from '../pages/schemas/tractate.schema';
import { Mishna, MishnaSchema } from '../pages/schemas/mishna.schema';
import { ImportDafAmudService } from './import-daf-amud.service';
import { ImportMishnaDafAmudService } from './import-mishna-daf-amud.service';

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
    ImportDafAmudService,
    ImportMishnaDafAmudService,
    SettingsService,
    ListService,
    NormalizeService,
    ParallelService,
  ],
})
export class ImportModule {}

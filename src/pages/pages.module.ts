import { Module } from '@nestjs/common';
import { MishnaController } from './mishna.controller';
import { PagesService } from './pages.service';
import { MongooseModule } from '@nestjs/mongoose';
import {  MishnaSchema } from './schemas/mishna.schema';
import { Tractate, TractateSchema } from './schemas/tractate.schema';
import { ConsoleModule } from 'nestjs-console';
import { Mishna } from './schemas/mishna.schema';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { EditMishnaController } from './edit.mishna.controller';
import { EditMishnaExcerptController } from './edit.excerpt.controller';
import { DraftJsService } from 'src/services/draftjs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tractate.name, schema: TractateSchema },
      { name: Mishna.name, schema: MishnaSchema }

    ]),
    ConsoleModule
  ],
  controllers: [MishnaController, EditMishnaController, EditMishnaExcerptController],
  providers: [
    PagesService,
    DraftJsService,
    TractateRepository,
    MishnaRepository,
  ],
  exports: [PagesService, TractateRepository,MishnaRepository]
})
export class PagesModule {}

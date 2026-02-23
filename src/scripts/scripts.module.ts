import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Mishna, MishnaSchema } from '../pages/schemas/mishna.schema';
import { MarkFirstSublineAsSugiaService } from './mark-first-subline-as-sugia.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mishna.name, schema: MishnaSchema },
    ]),
  ],
  providers: [
    MarkFirstSublineAsSugiaService,
  ],
})
export class ScriptsModule {}

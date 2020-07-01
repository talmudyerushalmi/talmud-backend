import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PageLine } from '../page.model';

@Schema()
export class Mishna extends Document {
  @Prop()
  id: string;

  @Prop()
  lines: PageLine[];
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);

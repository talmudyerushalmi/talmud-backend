import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Line } from '../page.model';

@Schema()
export class Mishna extends Document {
  @Prop()
  id: string;

  @Prop()
  lines: Line[];
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);

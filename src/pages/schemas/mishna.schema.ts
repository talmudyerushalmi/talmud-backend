import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Line } from '../line.model';
import { ObjectID } from 'mongodb';

@Schema()
export class Mishna extends Document {

  @Prop()
  _id: ObjectID;

  @Prop()
  id: string;

  @Prop()
  tractate: string;

  @Prop()
  chapter: string;

  @Prop()
  mishna: string;

  @Prop()
  lines: Line[];
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);

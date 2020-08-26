import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Line } from '../models/line.model';
import { ObjectID } from 'mongodb';
import { MishnaLink } from '../models/mishna.link.model';

 
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

  @Prop()
  previous?: MishnaLink

  @Prop()
  next?: MishnaLink
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);

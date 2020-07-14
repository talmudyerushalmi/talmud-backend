import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,  Types } from 'mongoose';
import { Mishna } from './mishna.schema';


export class Chapter {
  id: string;
  mishnaiot: MishnaRef[]
}

class MishnaRef {
  id:string;
  mishna: string;
  mishbaRef: Types.ObjectId
}
@Schema()
export class Tractate extends Document {
  @Prop()
  id: string;

  @Prop()
  title_heb: string;
  @Prop({
    default: []
  })
  chapters: Chapter[]

}

export const TractateSchema = SchemaFactory.createForClass(Tractate);

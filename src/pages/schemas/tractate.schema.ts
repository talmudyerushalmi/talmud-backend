import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,  Types, Schema as MongooseSchema } from 'mongoose';
import { Mishna } from './mishna.schema';

@Schema()
class MishnaRef {
  id:string;
  mishna: string;
  @Prop( { type: MongooseSchema.Types.ObjectId , ref: Mishna.name })
  mishnaRef: Types.ObjectId
}
@Schema()
export class Chapter {
  id: string;
  @Prop({default:[]})
  mishnaiot: MishnaRef[]
}


@Schema()
export class Tractate extends Document {
  @Prop()
  id: string;

  @Prop()
  order: number;

  @Prop()
  title_heb: string;
  @Prop({ default:[]})
  chapters: Chapter[]

}

export const TractateSchema = SchemaFactory.createForClass(Tractate);

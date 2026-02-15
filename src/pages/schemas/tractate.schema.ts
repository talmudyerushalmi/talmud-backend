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
export class AmudMapping {
  @Prop()
  amud: string;
  
  @Prop()
  chapter: string;
  
  @Prop()
  halacha: string;
  
  @Prop()
  system_line: string;
}

@Schema()
export class Daf {
  @Prop()
  id: string;
  
  @Prop({ default: [] })
  amudim: AmudMapping[];
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

  @Prop({ default: [] })
  dafs: Daf[]
}

export const TractateSchema = SchemaFactory.createForClass(Tractate);

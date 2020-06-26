import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,  Types } from 'mongoose';


export class Chapter {
  id: string;
  pages: PageRef[]
}

class PageRef {
  id:string;
  pagesRef: Types.ObjectId
}
@Schema()
export class Tractate extends Document {
  @Prop()
  id: string;

  @Prop()
  name: string;
  @Prop()
  chapters: Chapter[]
}

export const TractateSchema = SchemaFactory.createForClass(Tractate);

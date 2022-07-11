import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Manuscript } from '../models/related.model';

@Schema({ collection: 'related' })
export class Related extends Document {

  @Prop()
  guid: string;

 

  @Prop()
  manuscripts: Manuscript[];


}

export const RelatedSchema = SchemaFactory.createForClass(Related);

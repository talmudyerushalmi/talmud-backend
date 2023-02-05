import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Manuscripts extends Document {
  @Prop()
  id: string;

  @Prop()
  code: string;

  @Prop()
  index: string[];
}

export const ManuscriptSchema = SchemaFactory.createForClass(Manuscripts);

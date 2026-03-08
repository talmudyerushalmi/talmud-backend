import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'rabbies', timestamps: true })
export class Rabbi extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;
}

export const RabbiSchema = SchemaFactory.createForClass(Rabbi);

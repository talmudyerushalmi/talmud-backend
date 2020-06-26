import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PageLine } from '../page.model';

@Schema()
export class Page extends Document {
  @Prop()
  id: string;

  @Prop()
  lines: PageLine[];
}

export const PageSchema = SchemaFactory.createForClass(Page);

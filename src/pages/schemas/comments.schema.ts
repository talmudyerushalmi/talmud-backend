import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Comments as CommentsModel } from '../models/comment.model';

@Schema()
export class Comments extends Document {
  @Prop()
  id: string;

  @Prop()
  userID: string;

  @Prop()
  comments: CommentsModel;
}

export const CommentsSchema = SchemaFactory.createForClass(Comments);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Comment } from '../models/comment.model';

@Schema()
export class User extends Document {
  @Prop({ index: true, unique: true })
  userID: string;

  @Prop()
  comments: Comment[];
}

export const UserSchema = SchemaFactory.createForClass(User);

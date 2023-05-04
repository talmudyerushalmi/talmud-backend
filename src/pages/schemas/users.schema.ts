import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Comment } from '../models/comment.model';

@Schema()
export class Users extends Document {
  @Prop()
  id: string;

  @Prop()
  userID: string;

  @Prop()
  comments: Comment[];
}

export const UsersSchema = SchemaFactory.createForClass(Users);
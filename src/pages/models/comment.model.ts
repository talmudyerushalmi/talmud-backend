import { ObjectId } from 'mongodb';

export enum CommentType {
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class Comment {
  commentID: ObjectId;
  line: number;
  fromWord: string;
  toWord: string;
  text: string;
  type: CommentType;
  tractate: string;
  title: string;
}

import { ObjectId } from 'mongodb';

export enum CommentType {
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class Comment {
  commentID: ObjectId;
  title: string;
  text: string;
  type: CommentType;
  tractate: string;
  chapter: string;
  mishna: string;
  line: number;
  fromWord: string;
  toWord: string;
  subline: number;
}

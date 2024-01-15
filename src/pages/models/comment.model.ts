import { ObjectId } from 'mongodb';

export enum CommentType {
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class Comment {
  commentID: ObjectId;
  userName: string;
  title: string;
  text: string;
  type: CommentType;
  tractate: string;
  chapter: string;
  mishna: string;
  lineNumber: string;
  fromWord: string;
  toWord: string;
  fromSubline: number;
  toSubline: number;
  lineIndex: number;
}

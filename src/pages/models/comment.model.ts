import { ObjectId } from 'mongodb';

export enum CommentType {
  Public = 'public',
  Personal = 'personal',
  Inspect = 'inspect',
}

export class Comment {
  commentID: ObjectId;
  line: number;
  text: string;
  type: CommentType;
}

export class Comments {
  [key: string]: Comment[];
}

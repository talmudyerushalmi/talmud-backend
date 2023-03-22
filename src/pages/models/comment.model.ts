import { ObjectId } from 'mongodb';

export enum CommentType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class Comment {
  commentID: ObjectId;
  line: number;
  text: string;
  type: CommentType;
  tractate: string;
}

export class PublicCommentsByTractate {
  userID: string;
  comments: Comment[];
}

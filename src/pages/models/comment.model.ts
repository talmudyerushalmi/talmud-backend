import { ObjectId } from 'mongodb';

export class Comment {
  commentID: ObjectId;
  line: number;
  text: string;
}

export class Comments {
  [key: string]: Comment[];
}

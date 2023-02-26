export class Comment {
  line: string;
  comment: string;
}

export class Comments {
  [key: string]: Comment[];
}

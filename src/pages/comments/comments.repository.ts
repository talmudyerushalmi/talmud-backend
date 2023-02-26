import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comments.name)
    private commentsModel: Model<Comments>,
  ) {}

  async getCommentsByUser(userID: string): Promise<Comments> {
    return this.commentsModel.findOne({ userID });
  }

  async createComment(
    userID: string,
    comment: Comment,
    tractate: string,
  ): Promise<Comments> {
    const comments = await this.getCommentsByUser(userID);
    if (!comments) {
      const newComments = new this.commentsModel({
        userID,
        comments: { [tractate]: [comment] },
      });
      return newComments.save();
    }
    if (!comments.comments[tractate]) {
      comments.comments[tractate] = [comment];
    } else {
      comments.comments[tractate].push(comment);
    }
    return comments.save();
  }
}

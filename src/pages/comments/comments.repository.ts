import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { CommentDTO } from '../dto/comment';
import { Comment, CommentType } from '../models/comment.model';
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

  async getPublicCommentsByTractate(tractate: string): Promise<Comment[]> {
    return this.commentsModel.aggregate([
      {
        $project: {
          _id: 0,
          comments: {
            [tractate]: {
              $filter: {
                input: `$comments.${tractate}`,
                as: 'comment',
                cond: {
                  $eq: ['$$comment.type', CommentType.Public],
                },
              },
            },
          },
        },
      },
      // unwind the comments object
      { $unwind: `$comments.${tractate}` },
      // replace the root with the comments object
      { $replaceRoot: { newRoot: `$comments.${tractate}` } },
    ]);
  }

  async createComment(
    userID: string,
    comment: CommentDTO,
    tractate: string,
  ): Promise<Comments> {
    const newComment: Comment = {
      commentID: new ObjectId(),
      ...comment,
    };
    return this.commentsModel.findOneAndUpdate(
      { userID },
      {
        $push: {
          [`comments.${tractate}`]: newComment,
        },
      },
      { upsert: true, new: true },
    );
  }

  async removeComment(
    userID: string,
    tractate: string,
    commentID: string,
  ): Promise<Comments> {
    return this.commentsModel.findOneAndUpdate(
      { userID },
      {
        $pull: {
          [`comments.${tractate}`]: { commentID: new ObjectId(commentID) },
        },
      },
      { new: true },
    );
  }
}

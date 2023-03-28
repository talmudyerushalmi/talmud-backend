import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { CommentType, PublicCommentsByTractate } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comments.name)
    private commentsModel: Model<Comments>,
  ) {}

  async getCommentsByUser(
    userID: string,
    tractate?: string,
  ): Promise<Comments> {
    if (tractate) {
      const data = await this.commentsModel.aggregate<Comments>([
        {
          $match: {
            userID,
          },
        },
        { $limit: 1 },
        {
          $project: {
            userID: 1,
            comments: {
              $filter: {
                input: `$comments`,
                as: 'comment',
                cond: {
                  $eq: ['$$comment.tractate', tractate],
                },
              },
            },
          },
        },
      ]);
      return data[0];
    }
    return this.commentsModel.findOne({ userID });
  }

  async getPublicCommentsByTractate(
    tractate: string,
  ): Promise<PublicCommentsByTractate[]> {
    return this.commentsModel.aggregate([
      {
        $project: {
          _id: 0,
          userID: 1,
          comments: {
            $filter: {
              input: `$comments`,
              as: 'comment',
              cond: {
                $and: [
                  { $eq: ['$$comment.type', CommentType.PUBLIC] },
                  { $eq: ['$$comment.tractate', tractate] },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: { $gt: [{ $size: '$comments' }, 0] },
        },
      },
    ]);
  }

  async createComment(userID: string, comment: CommentDto): Promise<Comments> {
    const newComment = {
      commentID: new ObjectId(),
      ...comment,
    };
    return this.commentsModel.findOneAndUpdate(
      { userID },
      {
        $push: {
          comments: newComment,
        },
      },
      { upsert: true, new: true },
    );
  }

  async removeComment(userID: string, commentID: string): Promise<Comments> {
    return this.commentsModel.findOneAndUpdate(
      { userID },
      {
        $pull: {
          comments: { commentID: new ObjectId(commentID) },
        },
      },
      { new: true },
    );
  }

  async getCommentsForModeration(): Promise<Comments[]> {
    return this.commentsModel.aggregate([
      {
        $project: {
          userID: 1,
          comments: {
            $filter: {
              input: `$comments`,
              as: 'comment',
              cond: {
                $eq: ['$$comment.type', CommentType.MODERATION],
              },
            },
          },
        },
      },
      {
        $match: {
          $expr: { $gt: [{ $size: '$comments' }, 0] },
        },
      },
    ]);
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<Comments> {
    return this.commentsModel.findOneAndUpdate(
      { userID, 'comments.commentID': new ObjectId(comment.commentID) },
      {
        $set: {
          'comments.$.text': comment.text,
          'comments.$.line': comment.line,
          'comments.$.tractate': comment.tractate,
          'comments.$.type': comment.type,
          'comments.$.title': comment.title,
          'comments.$.subline': comment.subline,
        },
      },
      { new: true },
    );
  }
}

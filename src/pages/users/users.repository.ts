import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { CommentType } from '../models/comment.model';
import { Users } from '../schemas/users.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(Users.name)
    private usersModel: Model<Users>,
  ) {}

  async getCommentsByUser(userID: string, tractate?: string): Promise<Users> {
    if (tractate) {
      const data = await this.usersModel.aggregate<Users>([
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
    return this.usersModel.findOne({ userID });
  }

  async createComment(userID: string, comment: CommentDto): Promise<Users> {
    const newComment = {
      commentID: new ObjectId(),
      ...comment,
    };
    return this.usersModel.findOneAndUpdate(
      { userID },
      {
        $push: {
          comments: newComment,
        },
      },
      { upsert: true, new: true },
    );
  }

  async removeComment(userID: string, commentID: string): Promise<Users> {
    return this.usersModel.findOneAndUpdate(
      { userID },
      {
        $pull: {
          comments: { commentID: new ObjectId(commentID) },
        },
      },
      { new: true },
    );
  }

  async getCommentsForModeration(): Promise<Users[]> {
    return this.usersModel.aggregate([
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
  ): Promise<Users> {
    return this.usersModel.findOneAndUpdate(
      { userID, 'comments.commentID': new ObjectId(comment.commentID) },
      {
        $set: {
          'comments.$.text': comment.text,
          'comments.$.line': comment.line,
          'comments.$.tractate': comment.tractate,
          'comments.$.type': comment.type,
          'comments.$.title': comment.title,
          'comments.$.fromWord': comment.fromWord,
          'comments.$.toWord': comment.toWord,
        },
      },
      { new: true },
    );
  }
}

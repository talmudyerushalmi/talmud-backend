import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { CommentType } from '../models/comment.model';
import { User } from '../schemas/users.schema';
import { Comment } from '../models/comment.model';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async getCommentsByUser(
    userID: string,
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<User> {
    const data = await this.userModel.aggregate<User>([
      {
        $match: {
          userID,
        },
      },
      { $limit: 1 },
      {
        $project: {
          comments: {
            $filter: {
              input: `$comments`,
              as: 'comment',
              cond: {
                // TODO: check if have a better way to do this
                $and: [
                  {
                    $eq: ['$$comment.type', CommentType.PRIVATE],
                  },
                  { $eq: ['$$comment.tractate', tractate] },
                  {
                    $eq: ['$$comment.chapter', chapter],
                  },
                  { $eq: ['$$comment.mishna', mishna] },
                ],
              },
            },
          },
        },
      },
    ]);
    return data[0];
  }

  async createComment(userID: string, comment: CommentDto): Promise<User> {
    const newComment = {
      commentID: new ObjectId(),
      ...comment,
    };
    return this.userModel.findOneAndUpdate(
      { userID },
      {
        $push: {
          comments: newComment,
        },
      },
      { upsert: true, new: true },
    );
  }

  async removeComment(userID: string, commentID: string): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { userID },
      {
        $pull: {
          comments: { commentID: new ObjectId(commentID) },
        },
      },
      { new: true },
    );
  }

  async getCommentsForModeration(): Promise<User[]> {
    return this.userModel.aggregate([
      {
        $unwind: '$comments',
      },
      {
        $match: {
          'comments.type': CommentType.MODERATION,
        },
      },
      {
        $project: {
          _id: 0,
          userID: 1,
          commentID: '$comments.commentID',
          lineNumber: '$comments.lineNumber',
          text: '$comments.text',
          type: '$comments.type',
          tractate: '$comments.tractate',
          title: '$comments.title',
          fromWord: '$comments.fromWord',
          toWord: '$comments.toWord',
          chapter: '$comments.chapter',
          mishna: '$comments.mishna',
          subline: '$comments.subline',
          lineIndex: '$comments.lineIndex',
          fromSubline: '$comments.fromSubline',
          toSubline: '$comments.toSubline',
        },
      },
    ]);
  }

  async removeCommentForApproval(userID: string, commentID: string): Promise<Comment> {
    const commentObjId = new ObjectId(commentID);
    return this.userModel
      .findOneAndUpdate(
        { userID },
        {
          $pull: {
            comments: { commentID: commentObjId },
          },
        },
      )
      .then(user =>
        user.comments.find(comment => comment.commentID.equals(commentObjId)),
      );
  }

  async rejectComment(userID: string, commentID: string): Promise<User> {
    return this.removeComment(userID, commentID);
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { userID, 'comments.commentID': new ObjectId(comment.commentID) },
      {
        $set: {
          'comments.$.text': comment.text,
          'comments.$.title': comment.title,
        },
      },
      { new: true },
    );
  }
}

import { Injectable } from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UsersRepository } from './users.repository';
import { User } from '../schemas/users.schema';
import { MishnaRepository } from '../mishna.repository';
import { ExcerptUtils } from '../inc/excerptUtils';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private mishnaRepository: MishnaRepository,
  ) {}

  async getCommentsByUser(
    userID: string,
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<User> {
    return this.usersRepository.getCommentsByUser(
      userID,
      tractate,
      chapter,
      mishna,
    );
  }

  async createComment(userID: string, comment: CommentDto): Promise<User> {
    const mishnaDocSublines = (
      await this.mishnaRepository.find(
        comment.tractate,
        comment.chapter,
        comment.mishna,
      )
    ).lines[comment.lineIndex].sublines;
    const fromSubline = mishnaDocSublines[0].index;
    const toSubline = mishnaDocSublines[mishnaDocSublines.length - 1].index;
    const newComment = {
      ...comment,
      fromSubline,
      toSubline,
    };
    return this.usersRepository.createComment(userID, newComment);
  }

  async removeComment(userID: string, commentID: string): Promise<User> {
    return this.usersRepository.removeComment(userID, commentID);
  }

  async getCommentsForModeration(): Promise<User[]> {
    return this.usersRepository.getCommentsForModeration();
  }

  async approveComment(userID: string, commentID: string): Promise<any> {
    const approvedComment = await this.usersRepository.removeCommentForApproval(
      userID,
      commentID,
    );

    return await this.mishnaRepository
      .saveExcerpt(
        approvedComment.tractate,
        approvedComment.chapter,
        approvedComment.mishna,
        ExcerptUtils.buildExcerptComment(approvedComment),
      )
      .then(() => {
        return {
          success: true,
        };
      })
      .catch((err) => {
        return {
          error: err,
        };
      });
  }

  async rejectComment(userID: string, commentID: string): Promise<any> {
    await this.usersRepository.rejectComment(userID, commentID);
    return {
      success: true,
    };
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<User> {
    return this.usersRepository.updateComment(userID, comment);
  }
}

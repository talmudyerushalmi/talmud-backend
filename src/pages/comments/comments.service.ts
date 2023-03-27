import { Injectable } from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { Comments } from '../schemas/comments.schema';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(private commentsRepository: CommentsRepository) {}

  async getCommentsByUser(
    userID: string,
    tractate?: string,
  ): Promise<Comments> {
    return this.commentsRepository.getCommentsByUser(userID, tractate);
  }

  async createComment(userID: string, comment: CommentDto): Promise<Comments> {
    return this.commentsRepository.createComment(userID, comment);
  }

  async removeComment(userID: string, commentID: string): Promise<Comments> {
    return this.commentsRepository.removeComment(userID, commentID);
  }

  async getPublicCommentsByTractate(tractate: string): Promise<any[]> {
    return (await this.commentsRepository.getPublicCommentsByTractate(tractate))
      .map(comments => {
        return comments.comments.map(({ ...comment }) => ({
          userID: comments.userID,
          ...comment,
        }));
      })
      .reduce((acc, curr) => [...acc, ...curr], []);
  }

  async getCommentsForModeration(): Promise<Comments[]> {
    return this.commentsRepository.getCommentsForModeration();
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<Comments> {
    return this.commentsRepository.updateComment(userID, comment);
  }
}

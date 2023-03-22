import { Injectable } from '@nestjs/common';
import { CommentDTO } from '../dto/comment.dto';
import { PublicCommentsByTractate } from '../models/comment.model';
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

  async createComment(userID: string, comment: CommentDTO): Promise<Comments> {
    return this.commentsRepository.createComment(userID, comment);
  }

  async removeComment(userID: string, commentID: string): Promise<Comments> {
    return this.commentsRepository.removeComment(userID, commentID);
  }

  async getPublicCommentsByTractate(
    tractate: string,
  ): Promise<PublicCommentsByTractate[]> {
    return this.commentsRepository.getPublicCommentsByTractate(tractate);
  }

  async getCommentsForModeration(): Promise<Comments[]> {
    return this.commentsRepository.getCommentsForModeration();
  }
}

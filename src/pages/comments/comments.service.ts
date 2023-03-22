import { Injectable } from '@nestjs/common';
import { CommentDTO } from '../dto/comment';
import { PublicCommentsByTractate } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(private CommentsRepository: CommentsRepository) {}

  async getCommentsByUser(userID: string, tractate: string): Promise<Comments> {
    return this.CommentsRepository.getCommentsByUser(userID, tractate);
  }

  async createComment(userID: string, comment: CommentDTO): Promise<Comments> {
    return this.CommentsRepository.createComment(userID, comment);
  }

  async removeComment(userID: string, commentID: string): Promise<Comments> {
    return this.CommentsRepository.removeComment(userID, commentID);
  }

  async getPublicCommentsByTractate(
    tractate: string,
  ): Promise<PublicCommentsByTractate[]> {
    return this.CommentsRepository.getPublicCommentsByTractate(tractate);
  }

  async getCommentsForModeration(): Promise<Comments[]> {
    return this.CommentsRepository.getCommentsForModeration();
  }
}

import { Injectable } from '@nestjs/common';
import { CommentDTO } from '../dto/comment';
import { Comment } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(private CommentsRepository: CommentsRepository) {}

  async getCommentsByUser(userID: string): Promise<Comments> {
    return this.CommentsRepository.getCommentsByUser(userID);
  }

  async createComment(
    userID: string,
    comment: CommentDTO,
    tractate: string,
  ): Promise<Comments> {
    return this.CommentsRepository.createComment(userID, comment, tractate);
  }

  async removeComment(
    userID: string,
    tractate: string,
    commentID: string,
  ): Promise<Comments> {
    return this.CommentsRepository.removeComment(userID, tractate, commentID);
  }

  async getPublicCommentsByTractate(tractate: string): Promise<Comment[]> {
    return this.CommentsRepository.getPublicCommentsByTractate(tractate);
  }

  async getCommentsForModeration(): Promise<Comments> {
    return this.CommentsRepository.getCommentsForModeration();
  }
}

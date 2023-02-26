import { Injectable } from '@nestjs/common';
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
    comment: Comment,
    tractate: string,
  ): Promise<Comments> {
    return this.CommentsRepository.createComment(userID, comment, tractate);
  }
}

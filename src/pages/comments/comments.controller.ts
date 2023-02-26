import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Comment } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get(':userID')
  async getCommentsByUser(@Param('userID') userID: string): Promise<Comments> {
    return this.commentsService.getCommentsByUser(userID);
  }

  @Post(':userID/:tractate')
  async createComment(
    @Param('userID') userID: string,
    @Param('tractate') tractate: string,
    @Body('comment') comment: Comment,
  ): Promise<Comments> {
    return this.commentsService.createComment(userID, comment, tractate);
  }
}

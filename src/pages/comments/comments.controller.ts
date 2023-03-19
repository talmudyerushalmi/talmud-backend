import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CommentDTO } from '../dto/comment';
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

  @Get('/public/:tractate')
  async getPublicCommentsByTractate(
    @Param('tractate') tractate: string,
  ): Promise<Comment[]> {
    return this.commentsService.getPublicCommentsByTractate(tractate);
  }

  @Post(':userID/:tractate')
  async createComment(
    @Param('userID') userID: string,
    @Param('tractate') tractate: string,
    @Body() comment: CommentDTO,
  ): Promise<Comments> {
    return this.commentsService.createComment(userID, comment, tractate);
  }

  @Delete(':userID/:tractate/:commentID')
  async removeComment(
    @Param('userID') userID: string,
    @Param('tractate') tractate: string,
    @Param('commentID') commentID: string,
  ): Promise<Comments> {
    return this.commentsService.removeComment(userID, tractate, commentID);
  }
}

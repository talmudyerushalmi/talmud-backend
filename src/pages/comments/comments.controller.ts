import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { CommentDTO } from '../dto/comment.dto';
import { PublicCommentsByTractate } from '../models/comment.model';
import { Comments } from '../schemas/comments.schema';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('/moderation')
  async getCommentsForModeration(): Promise<Comments[]> {
    return this.commentsService.getCommentsForModeration();
  }

  @Get('/public/:tractate')
  async getPublicCommentsByTractate(
    @Param('tractate') tractate: string,
  ): Promise<PublicCommentsByTractate[]> {
    return this.commentsService.getPublicCommentsByTractate(tractate);
  }

  @Get('/:userID/:tractate?')
  async getCommentsByUser(
    @Param('userID') userID: string,
    @Param('tractate') tractate?: string,
  ): Promise<Comments> {
    return this.commentsService.getCommentsByUser(userID, tractate);
  }

  @Post('/create/:userID')
  async createComment(
    @Param('userID') userID: string,
    @Body() comment: CommentDTO,
  ): Promise<Comments> {
    return this.commentsService.createComment(userID, comment);
  }

  @Patch('/:userID/:commentID')
  async updateComment(
    @Param('userID') userID: string,
    @Param('commentID') commentID: string,
    @Body() comment: CommentDTO,
  ): Promise<Comments> {
    return this.commentsService.updateComment(userID, commentID, comment);
  }

  @Delete('/:userID/:commentID')
  async removeComment(
    @Param('userID') userID: string,
    @Param('commentID') commentID: string,
  ): Promise<Comments> {
    return this.commentsService.removeComment(userID, commentID);
  }
}

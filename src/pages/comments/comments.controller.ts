import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
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
  ): Promise<any[]> {
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
    @Body() comment: CommentDto,
  ): Promise<Comments> {
    return this.commentsService.createComment(userID, comment);
  }

  @Patch('/:userID')
  async updateComment(
    @Param('userID') userID: string,
    @Body() comment: UpdateCommentDto,
  ): Promise<Comments> {
    return this.commentsService.updateComment(userID, comment);
  }

  @Delete('/:userID/:commentID')
  async removeComment(
    @Param('userID') userID: string,
    @Param('commentID') commentID: string,
  ): Promise<Comments> {
    return this.commentsService.removeComment(userID, commentID);
  }
}

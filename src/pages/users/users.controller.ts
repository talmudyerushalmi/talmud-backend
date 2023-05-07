/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Response,
} from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { User } from '../schemas/users.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/comments/moderation')
  async getCommentsForModeration(): Promise<User[]> {
    return this.usersService.getCommentsForModeration();
  }

  @Get('/comments/:tractate/:chapter/:mishna')
  async getCommentsByUser(
    @Response() res,
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
  ): Promise<User> {
    const comments = await this.usersService.getCommentsByUser(
      res.locals.user?.email,
      tractate,
      chapter,
      mishna,
    );
    return res.json(comments);
  }

  @Post('/comments')
  async createComment(
    @Response() res,
    @Body() comment: CommentDto,
  ): Promise<User> {
    const newComment = await this.usersService.createComment(
      res.locals.user?.email,
      comment,
    );
    return res.json(newComment);
  }

  @Patch('/comments')
  async updateComment(
    @Response() res,
    @Body() comment: UpdateCommentDto,
  ): Promise<User> {
    const updatedComment = await this.usersService.updateComment(
      res.locals.user?.email,
      comment,
    );
    return res.json(updatedComment);
  }

  @Delete('/comments/:commentID')
  async removeComment(
    @Response() res,
    @Param('commentID') commentID: string,
  ): Promise<User> {
    const comments = await this.usersService.removeComment(
      res.locals.user?.email,
      commentID,
    );
    return res.json(comments);
  }
}

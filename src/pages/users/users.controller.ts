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
import { Users } from '../schemas/users.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/comments/moderation')
  async getCommentsForModeration(): Promise<Users[]> {
    return this.usersService.getCommentsForModeration();
  }

  @Get('/comments/:userID/:tractate?')
  async getCommentsByUser(
    @Param('userID') userID: string,
    @Param('tractate') tractate?: string,
  ): Promise<Users> {
    return this.usersService.getCommentsByUser(userID, tractate);
  }

  @Post('/comments/:userID')
  async createComment(
    @Param('userID') userID: string,
    @Body() comment: CommentDto,
  ): Promise<Users> {
    return this.usersService.createComment(userID, comment);
  }

  @Patch('/comments/:userID')
  async updateComment(
    @Param('userID') userID: string,
    @Body() comment: UpdateCommentDto,
  ): Promise<Users> {
    return this.usersService.updateComment(userID, comment);
  }

  @Delete('/comments/:userID/:commentID')
  async removeComment(
    @Param('userID') userID: string,
    @Param('commentID') commentID: string,
  ): Promise<Users> {
    return this.usersService.removeComment(userID, commentID);
  }
}

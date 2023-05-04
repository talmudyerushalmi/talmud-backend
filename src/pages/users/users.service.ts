import { Injectable } from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UsersRepository } from './users.repository';
import { Users } from '../schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async getCommentsByUser(userID: string, tractate?: string): Promise<Users> {
    return this.usersRepository.getCommentsByUser(userID, tractate);
  }

  async createComment(userID: string, comment: CommentDto): Promise<Users> {
    return this.usersRepository.createComment(userID, comment);
  }

  async removeComment(userID: string, commentID: string): Promise<Users> {
    return this.usersRepository.removeComment(userID, commentID);
  }

  async getCommentsForModeration(): Promise<Users[]> {
    return this.usersRepository.getCommentsForModeration();
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<Users> {
    return this.usersRepository.updateComment(userID, comment);
  }
}

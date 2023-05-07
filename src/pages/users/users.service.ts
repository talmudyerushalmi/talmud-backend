import { Injectable } from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UsersRepository } from './users.repository';
import { User } from '../schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async getCommentsByUser(
    userID: string,
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<User> {
    return this.usersRepository.getCommentsByUser(
      userID,
      tractate,
      chapter,
      mishna,
    );
  }

  async createComment(userID: string, comment: CommentDto): Promise<User> {
    return this.usersRepository.createComment(userID, comment);
  }

  async removeComment(userID: string, commentID: string): Promise<User> {
    return this.usersRepository.removeComment(userID, commentID);
  }

  async getCommentsForModeration(): Promise<User[]> {
    return this.usersRepository.getCommentsForModeration();
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<User> {
    return this.usersRepository.updateComment(userID, comment);
  }
}

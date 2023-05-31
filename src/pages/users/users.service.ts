import { Injectable } from '@nestjs/common';
import { CommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { UsersRepository } from './users.repository';
import { User } from '../schemas/users.schema';
import { MishnaRepository } from '../mishna.repository';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private mishnaRepository: MishnaRepository,
  ) {}

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

  async approveComment(userID: string, commentID: string): Promise<any> {
    const approvedComment = await this.usersRepository.approveComment(
      userID,
      commentID,
    );
    console.log(approvedComment);
    return await this.mishnaRepository
      .saveExcerpt(
        approvedComment.tractate,
        approvedComment.chapter,
        approvedComment.mishna,
        {
          type: 'COMMENT',
          seeReference: false,
          source: {},
          sourceLocation: approvedComment.subline.toString(),
          editorStateFullQuote: {
            blocks: [
              {
                key: '',
                text: approvedComment.text,
                type: 'unstyled',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
              },
            ],
            entityMap: {},
          },
          synopsis: '',
          editorStateComments: {
            blocks: [
              {
                key: 'imprt',
                text: '',
                type: 'unstyled',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
              },
            ],
            entityMap: {},
          },
          selection: {
            fromLine: approvedComment.line,
            fromWord: approvedComment.fromWord,
            fromOffset: 1,
            toLine: approvedComment.line,
            toWord: approvedComment.toWord,
            toOffset: 1,
            fromSubline: approvedComment.subline,
            toSubline: approvedComment.subline,
            fromWordOccurence: 1,
            toWordOccurence: 1,
          },
        },
      )
      .then(res => {
        return {
          success: true,
        };
      })
      .catch(err => {
        return {
          error: err,
        };
      });
  }

  async rejectComment(userID: string, commentID: string): Promise<any> {
    await this.usersRepository.rejectComment(userID, commentID);
    return {
      success: true,
    }
  }

  async updateComment(
    userID: string,
    comment: UpdateCommentDto,
  ): Promise<User> {
    return this.usersRepository.updateComment(userID, comment);
  }
}

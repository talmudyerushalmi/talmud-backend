import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CommentType } from '../models/comment.model';

export class CommentDTO {
  @IsNotEmpty()
  @IsNumber()
  line: number;
  @IsNotEmpty()
  @IsString()
  text: string;
  @IsNotEmpty()
  @IsString()
  @IsEnum(CommentType)
  type: CommentType;
  @IsNotEmpty()
  @IsString()
  tractate: string;
}

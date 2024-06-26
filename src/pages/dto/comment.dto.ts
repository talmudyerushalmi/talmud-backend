import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

enum CommentTypeDTO {
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class CommentDto {
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  text: string;
  @IsNotEmpty()
  @IsString()
  @IsEnum(CommentTypeDTO)
  type: CommentTypeDTO;
  @IsNotEmpty()
  @IsString()
  tractate: string;
  @IsNotEmpty()
  @IsString()
  chapter: string;
  @IsNotEmpty()
  @IsString()
  mishna: string;
  @IsNotEmpty()
  @IsNumber()
  lineIndex: number;
  @IsNotEmpty()
  lineNumber: string;
  // @IsNotEmpty()
  @IsString()
  fromWord: string;
  // @IsNotEmpty()
  @IsString()
  toWord: string;
  @IsString()
  @IsNotEmpty()
  userName: string;
}

export class UpdateCommentDto extends CommentDto {
  @IsNotEmpty()
  @IsString()
  commentID: string;
}

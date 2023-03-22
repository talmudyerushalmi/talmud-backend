import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

enum CommentTypeDTO {
  PRIVATE = 'private',
  MODERATION = 'moderation',
}

export class CommentDto {
  @IsNotEmpty()
  @IsNumber()
  line: number;
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
}

export class UpdateCommentDto extends CommentDto {
  @IsNotEmpty()
  @IsString()
  commentID: string;
}

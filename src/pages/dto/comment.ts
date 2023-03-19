import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CommentDTO {
  @IsNotEmpty()
  @IsNumber()
  line: number;
  @IsNotEmpty()
  @IsString()
  text: string;
}

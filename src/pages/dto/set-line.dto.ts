import { IsString } from 'class-validator';

export class SetLineDto {


  @IsString()
  originalLineNumber?: string;

  @IsString()
  line: string;

  @IsString()
  text: string;
}

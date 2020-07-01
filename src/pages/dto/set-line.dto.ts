import { IsString } from 'class-validator';

export class SetLineDto {

  @IsString()
  chapter: string;

  @IsString()
  mishna: string;

  @IsString()
  line: string;

  @IsString()
  text: string;
}

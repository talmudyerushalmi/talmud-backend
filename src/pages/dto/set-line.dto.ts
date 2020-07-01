import { IsString } from 'class-validator';

export class SetLineDto {


  @IsString()
  line: string;

  @IsString()
  text: string;
}

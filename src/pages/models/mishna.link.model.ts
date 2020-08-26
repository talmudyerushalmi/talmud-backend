import { IsNotEmpty, IsString } from 'class-validator';



export class MishnaLink {
  @IsNotEmpty()
  @IsString()
  tractate: string;
  @IsNotEmpty()
  @IsString()
  chapter: string;
  @IsNotEmpty()
  @IsString()
  mishna: string;

  lineFrom?: string;

  lineTo?: string;
  
};



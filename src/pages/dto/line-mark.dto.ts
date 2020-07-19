import {  IsString, IsNotEmpty } from 'class-validator';

export class LineMarkDto {

  @IsNotEmpty()
  @IsString()
  tractate: string;
 
  @IsNotEmpty()
  @IsString()
  chapter:string;
 
  @IsNotEmpty()
  @IsString()
  mishna:string;

  @IsNotEmpty()
  @IsString()
  line:string;
}

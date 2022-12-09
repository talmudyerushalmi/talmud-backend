import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddCompositionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsOptional()
  secondary_title?:string;
  @IsString()
  date: string;
  @IsString()
  type: string;
  @IsString()
  @IsOptional()
  author?: string;
  @IsString()
  @IsOptional()
  edition?: string;
}

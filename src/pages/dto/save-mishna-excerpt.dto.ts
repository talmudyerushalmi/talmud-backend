import { IsString, IsBoolean, IsNumber, IsObject, IsOptional, IsUrl } from 'class-validator';
import { iSelection } from '../models/mishna.excerpt.model';


export class SaveMishnaExcerptDto {
  @IsOptional()
  @IsNumber()
  key: number;
  @IsString()
  type: string;
  @IsOptional()
  @IsBoolean()
  seeReference: boolean;
  @IsOptional()
  @IsObject()
  source: Record<string, unknown>;
  @IsOptional()
  @IsString()
  sourceLocation: string;
  
  @IsObject()
  editorStateFullQuote: Record<string, unknown>;
  @IsOptional()
  @IsString()
  synopsis: string;
  @IsOptional()
  @IsObject()
  editorStateComments:Record<string, unknown>;
  @IsObject()
  selection: iSelection;
  @IsOptional()
  automaticImport?: boolean;
  @IsString()
  @IsOptional()
  link?: string;
  @IsString()
  @IsOptional()
  short?: string;
};



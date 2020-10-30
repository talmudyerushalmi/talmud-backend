import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsObject, IsOptional } from 'class-validator';
import { iSelection } from '../models/mishna.excerpt.model';


export class SaveMishnaExcerptDto {
  @IsOptional()
  @IsNumber()
  key: number;
  @IsString()
  type: string;
  @IsBoolean()
  seeReference: boolean;
  
  @IsObject()
  source: Record<string, unknown>;
  @IsString()
  sourceLocation: string;
  
  @IsObject()
  editorStateFullQuote: Record<string, unknown>;
  @IsObject()
  editorStateShortQuote : Record<string, unknown>;
  @IsString()
  synopsis: string;
  @IsObject()
  editorStateComments:Record<string, unknown>;
  @IsObject()
  selection: iSelection;

};



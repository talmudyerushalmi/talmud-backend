import { IsNotEmpty, IsString, IsBoolean, IsNumber } from 'class-validator';

export class SaveMishnaExcerptDto {
  _id: string;
  type: string;
  @IsNumber()
  @IsNotEmpty()
  fromLine: number;
  @IsString()
  @IsNotEmpty()
  fromWord: string;
  @IsNumber()
  @IsNotEmpty()
  toLine: number;
  @IsString()
  @IsNotEmpty()
  toWord: string;
  @IsBoolean()
  seeReference: boolean;
  @IsNotEmpty()
  @IsString()
  sourceName: string;
  @IsString()
  sourceLocation: string;
  editorStateFullQuote: Record<string, unknown>;
  editorStateShortQuote : Record<string, unknown>;
  @IsString()
  synopsis: string;
  editorStateComments:Record<string, unknown>;

};



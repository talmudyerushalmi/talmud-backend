import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class ExcerptMishna {
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
  @IsObject()
  source:  Record<string, unknown>;
  @IsString()
  sourceLocation: string;
  editorStateFullQuote: Record<string, unknown>;
  editorStateShortQuote : Record<string, unknown>;
  @IsString()
  synopsis: string;
  editorStateComments:Record<string, unknown>;

};



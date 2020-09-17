import { IsNotEmpty, IsString, IsBoolean, IsNumber } from 'class-validator';

export interface iSelection {
  fromLine: number;
  fromWord: string;
  fromOffset: number;
  toLine: number;
  toWord: string;
  toOffset: number;
}
export class MishnaExcerpt {
  key: number;
  type: string;
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
  selection: iSelection;

};



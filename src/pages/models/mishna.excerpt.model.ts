import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export interface iSelection {
  fromLine: number;
  fromSubline?: number;
  fromSublineOffset?: number;
  fromWord: string;
  fromWordOccurence: number;
  fromWordOccurenceSubline?: number;
  fromWordTotal?: number;
  fromOffset: number;
  toLine: number;
  toSubline?: number;
  toSublineOffset?: number;
  toWord: string;
  toWordOccurence: number;
  toWordOccurenceSubline?: number;
  toWordTotal?: number;
  toOffset: number;
}
export class MishnaExcerpt {
  key: number;
  type: string;
  @IsBoolean()
  seeReference: boolean;
  @IsNotEmpty()
  @IsString()
  source: Record<string, unknown>;;
  @IsString()
  sourceLocation: string;
  editorStateFullQuote: Record<string, unknown>;
  @IsString()
  synopsis: string;
  editorStateComments:Record<string, unknown>;
  selection: iSelection;
  automaticImport?: boolean;
  flagNeedUpdate?: boolean;

};



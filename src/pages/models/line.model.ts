import { IsNotEmpty, IsString } from 'class-validator';

export type sourceType = "direct_sources" | "indirect_sources";

export class Synopsis {
  text: EditedText;
  type: sourceType;
  name: string;
  id: string;
  code: string;
  button_code: string;
  manuscript?: string;
}

type RawDraftContentState = any;
export interface EditedText {
  simpleText: string;
  content?: RawDraftContentState;
  editor?: any, // maybe can be removed
}
export class SubLine {
  text: string;
  index: number;
  synopsis: Synopsis[]
}

export class Line {
  originalLineNumber?: string;
  lineNumber?: string;
  sourceReference?: string;

  @IsNotEmpty()
  @IsString()
  mainLine: string;

  sublines?: SubLine[]

  @IsString()
  sugiaName: string;

};



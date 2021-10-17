import { IsNotEmpty, IsString } from 'class-validator';

export class Synopsis {
  text: EditedText;
  type: string;
  name: string;
  id: string;
  code: string;
  button_code: string;
  manuscript?: string;
}

export type EditedText = string | Record<string, unknown>;

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



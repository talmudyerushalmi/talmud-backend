import { IsNotEmpty, IsString } from 'class-validator';

export class Synopsis {
  text: string;
  type: string;
  name: string;
  id: string;
  code: string;
  button_code: string;
  manuscript: string;
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

};



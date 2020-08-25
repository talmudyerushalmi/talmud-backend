import { IsNotEmpty, IsString } from 'class-validator';

export class SynopsisLine {
  text: string;
  manuscript: string;
}

export class SubLine {
  text: string;
}

export class Line {
  originalLineNumber?: string;
  lineNumber?: string;
  sourceReference?: string;

  @IsNotEmpty()
  @IsString()
  mainLine: string;
  synopsis?: SynopsisLine[]

  sublines?: SubLine[]

};



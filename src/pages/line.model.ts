import { IsNotEmpty, IsString } from 'class-validator';

export class SynopsisLine {
  text: string;
  manuscript: string;
}
export class Line {
  lineNumber?: string;
  sourceReference?: string;

  @IsNotEmpty()
  @IsString()
  mainLine: string;
  synopsis?: SynopsisLine[]

};



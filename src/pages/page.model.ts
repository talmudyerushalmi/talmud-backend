import { IsNotEmpty, IsString } from 'class-validator';

export class SynopsisLine {
  text: string;
  manuscript: string;
}
export class Line {
  lineNumber?: number;
  sourceReference?: string;

  @IsNotEmpty()
  @IsString()
  mainLine: string;
  synopsis?: SynopsisLine[]

};



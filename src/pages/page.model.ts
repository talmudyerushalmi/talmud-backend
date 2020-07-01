import { IsNotEmpty } from 'class-validator';

export class SynopsisLine {
  text: string;
  manuscript: string;
}
export class PageLine {
  @IsNotEmpty()
  lineNumber: number;
  sourceReference?: string;
  mainLine: {
    text: string;
  };
  synopsis?: SynopsisLine[]

};



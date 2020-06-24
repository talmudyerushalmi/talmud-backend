
export class SynopsisLine {
  text: string;
  manuscript: string;
}
export class PageLine {
  lineNumber: number;
  sourceReference?: string;
  mainLine: {
    text: string;
  };
  synopsis?: SynopsisLine[]

};



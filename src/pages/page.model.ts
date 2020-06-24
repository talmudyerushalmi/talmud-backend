
export interface SynopsisLine {
  text: string;
  manuscript: string;
}
export interface PageLine {
  lineNumber: number;
  sourceReference?: string;
  mainLine: {
    text: string;
  }
  synopsis?: SynopsisLine[]

}

export interface Page {
  id: string;
  lines: PageLine[]
}



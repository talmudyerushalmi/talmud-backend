export interface ISearch {
  tractate: string;
  text: string;
}

export interface ISearchResult {
  guid: string;
  results: {
    mainLine: string;
    lineNumber: string;
  }[];
}

export interface ISearch {
  tractate: string;
  text: string;
}

export interface ISearchResult {
  guid: string;
  mainLine: string;
  lineNumber: string;
  /** Set when the matched line lives inside a split halacha. 1-based part index used by
   *  the FE to build a `?part=N` URL so the link lands on the correct mini-halacha. */
  part?: number;
}

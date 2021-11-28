import { Line } from "./line.model";

interface ExcerptSelectionConstructor {
    fromLine: number;
    fromWord: string;
    fromOffset: number;
    fromWordOccurence: number;
    fromWordTotal: number;
    toLine: number;
    toWord: string;
    toWordOccurence: number;
    toWordTotal: number;
    toOffset: number;
}
export class ExcerptSelection {
    constructor(s: ExcerptSelectionConstructor){
      this.fromLine = s.fromLine;
      this.fromWord = s.fromWord;
      this.fromWordOccurence = s.fromWordOccurence;
      this.fromWordTotal = s.fromWordTotal;
      this.fromOffset = s.fromOffset;
      this.toLine = s.toLine;
      this.toWord = s.toWord;
      this.toWordOccurence = s.toWordOccurence;
      this.toWordTotal = s.toWordTotal;
      this.toOffset = s.toOffset;
    }

    fromLine: number;
    fromSubline?: number;
    fromWord: string;
    fromWordOccurence: number;
    fromWordOccurenceSubline: number;
    fromWordTotal: number;
    fromOffset: number;
    toLine: number;
    toSubline?: number;
    toWord: string;
    toWordOccurence: number;
    toWordOccurenceSubline: number;
    toWordTotal: number;
    toOffset: number;
    updateSublines(fromLine: Line, toLine: Line) :ExcerptSelection {
      [this.fromSubline, this.fromWordOccurenceSubline] = getSublineSelection(fromLine, this.fromWord, this.fromWordOccurence);
      [this.toSubline, this.toWordOccurenceSubline] = getSublineSelection(toLine, this.toWord, this.toWordOccurence);
      return this;
    }
  }

  export function getSublineSelection(line: Line, word: string, occurence: number): [number|undefined, number|undefined] {
    let totalOccurences = 0;
    let index = 0;
    while (totalOccurences<occurence && index<line.sublines.length) {
      let occurenceInSubline = 0;
      const offsetsInSubline = getWordOccurenceOffsets(line.sublines[index].text, word);
      while (offsetsInSubline.shift()!==undefined) {
        occurenceInSubline++;
        if ((totalOccurences+occurenceInSubline)===occurence) {
          return [line.sublines[index].index, occurenceInSubline]
        }
      }
      totalOccurences+= occurenceInSubline;
  
      index++;
    }
 
    return [0,0]
  }

  export function getOffsetOfWordOccurence(text: string, word: string, occurence = 1):number {
    if (occurence===1) {
      return text.indexOf(word);
    }
    else {
      const offset = text.indexOf(word) + word.length;
      const sub = text.substr(offset)
      console.log('look in ',sub)
      return getOffsetOfWordOccurence(sub, word, occurence-1) + offset;
    }
  
  }

  // returns array of offsets in text
  export function getWordOccurenceOffsets(
    text: string,
    word: string,
    offset = 0
  ): number[] {
    const occurences = [];
    const found = text.indexOf(word);
    if (found!==-1) {
      const remainder = text.substr(found+word.length)
      return [...occurences, found+offset, ...getWordOccurenceOffsets(remainder,word, found+word.length)]
    }
    return [];
  }



  export function getWordOccurence(
    inText: string,
    offset: number,
    word: string
  ): [number, number] {
    const textUntilOffset = inText.substring(0, offset);
    const regex = new RegExp(word, "g");
    const foundUntilOffset = textUntilOffset.match(regex);
    const foundInText = inText.match(regex);
    const occurences = foundInText ? foundInText.length : 0;
    const occurence = foundUntilOffset ? foundUntilOffset.length + 1 : 1;
    return [occurence, occurences];
  }


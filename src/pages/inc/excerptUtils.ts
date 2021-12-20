import { Line, SubLine } from '../models/line.model';
import { MishnaExcerpt } from '../models/mishna.excerpt.model';
import { Mishna } from '../schemas/mishna.schema';
import * as _ from 'lodash';

function getSublineAddition(offset: number, newNosach: string[]): number {
  let line;
  let index = 0;
  let sublines = 0;
  let totalOffset = 0;
  do {
    line = newNosach[index];
    totalOffset += line.length;
    index++;
    sublines++;
  } while (index < newNosach.length && offset > totalOffset);

  return sublines - 1;
}

const SPACE_BETWEEN_LINES = 1;
function calculateSublineOffset(
  line: Line,
  lineOffset: number,
): [number, number] {
  let index = 0;
  let subline = line.sublines[index];
  while (lineOffset >= subline.text.length + SPACE_BETWEEN_LINES) {
    if (lineOffset === subline.text.length + SPACE_BETWEEN_LINES) { // moving to next line
     lineOffset = lineOffset - subline.text.length - SPACE_BETWEEN_LINES; 
    }
    else if (lineOffset > subline.text.length + SPACE_BETWEEN_LINES) { // moving to next line
        lineOffset = lineOffset - subline.text.length - SPACE_BETWEEN_LINES; 
    }
    else if (lineOffset < subline.text.length + SPACE_BETWEEN_LINES) {
        lineOffset = lineOffset - subline.text.length; 
    };
    index++;
    subline = line.sublines[index];
  }
  return [subline.index, lineOffset]; //  +index adding index to line offset for the space between lines
}

function getOffsetAddition(oldNosach: string[], newNosach: string[]): number {
  let line;
  let index = 0;
  let sublines = 0;
  let totalOffset = 0;
  do {
    line = newNosach[index];
    totalOffset += line.length;
    index++;
    sublines++;
  } while (index < newNosach.length);

  return sublines - 1;
}

function getSublineIndex(wordSelection: string, occurence:number, line: Line) : [number, number] {
  let subline: SubLine;
  let index = 0;
  let found = 0;
  let words = [];
  let sublineWordCount = occurence;
  let wordsInSubline;
  do {
    subline = line.sublines[index];
    wordsInSubline = ExcerptUtils.getWordsInText(subline.text, wordSelection);
    found+= wordsInSubline;
    sublineWordCount-= wordsInSubline
    index++;
  } while (index < line.sublines.length && found<occurence);
  return [subline.index, sublineWordCount+wordsInSubline];
}
export class ExcerptUtils {
  constructor(private excerpt: MishnaExcerpt) {}

  static stripCharacters(text: string): string {
    const pattern = /[^א-ת\s]/g;
    return text.replace(pattern,'');
  }
  static getWordsInText(text: string, wordToSearch: string){
    const stripped = ExcerptUtils.stripCharacters(text);
    let pattern = /[א-ת\"'><[\]]+/g;
    const words = _.words(stripped,pattern);

    return words.filter(word => word === wordToSearch).length;
  }

  updateExcerptSubline(fromLine: Line, toLine: Line): void {
    [this.excerpt.selection.fromSubline, this.excerpt.selection.fromWordOccurenceSubline]= getSublineIndex(this.excerpt.selection.fromWord, this.excerpt.selection.fromWordOccurence, fromLine);
    [this.excerpt.selection.toSubline, this.excerpt.selection.toWordOccurenceSubline] = getSublineIndex(this.excerpt.selection.toWord, this.excerpt.selection.toWordOccurence, toLine);
  }

  updateExcerptSublineold(sublineIndex: number, newNosach: string[]): void {
    const added = newNosach.length - 1;
    if (this.excerpt.selection.fromSubline > sublineIndex) {
      this.excerpt.selection.fromSubline += added;
    }
    if (this.excerpt.selection.toSubline > sublineIndex) {
      this.excerpt.selection.toSubline += added;
    }
    if (this.excerpt.selection.fromSubline === sublineIndex) {
      this.excerpt.selection.fromSubline += getSublineAddition(
        this.excerpt.selection.fromOffset,
        newNosach,
      );
    }
    if (this.excerpt.selection.toSubline === sublineIndex) {
      this.excerpt.selection.toSubline += getSublineAddition(
        this.excerpt.selection.toOffset,
        newNosach,
      );
    }
  }
  calculateSublineOffset(lineFrom: Line, lineTo: Line): void {
    [
      this.excerpt.selection.fromSubline,
      ] = calculateSublineOffset(lineFrom, this.excerpt.selection.fromOffset);

    [
      this.excerpt.selection.toSubline,
     ] = calculateSublineOffset(lineTo, this.excerpt.selection.toOffset);
  }
  calculateSublineSelection(lineFrom: Line, lineTo: Line): void {
    [
      this.excerpt.selection.fromSubline,
    ] = calculateSublineOffset(lineFrom, this.excerpt.selection.fromOffset);
    [
      this.excerpt.selection.toSubline,
    ] = calculateSublineOffset(lineTo, this.excerpt.selection.toOffset);

  
  }
  updateExcerptOffset(
    lineIndex: number,
    oldNosach: string[],
    newNosach: string[],
  ): void {
    const added = newNosach.length - 1;
    if (this.excerpt.selection.fromLine === lineIndex) {
      this.excerpt.selection.fromOffset += getOffsetAddition(
        oldNosach,
        newNosach,
      );
    }
    if (this.excerpt.selection.toLine === lineIndex) {
      // this.excerpt.selection.toSubline +=
      //getSublineAddition(this.excerpt.selection.toOffset, newNosach)
    }
  }
}

import { IsNotEmpty, IsString } from 'class-validator';
import { RawDraftContentState } from 'draft-js';

export enum SourceType {
  DIRECT_SOURCES = 'direct_sources',
  INDIRECT_SOURCES = 'indirect_sources',
  PARALLEL_SOURCE = 'parallel_source'
}

export type sourceType = SourceType.DIRECT_SOURCES | SourceType.INDIRECT_SOURCES | SourceType.PARALLEL_SOURCE;

export class Synopsis {
  text: EditedText;
  type: sourceType;
  name: string;
  id: string;
  code: string;
  button_code: string;
  manuscript?: string;
}

export interface EditedText {
  simpleText: string;
  content?: RawDraftContentState;
  editor?: any, // maybe can be removed
}
export class SubLine {
  text: string;
  index: number;
  sugiaName?: string;
  subSugiaName?: string;
  nosach: RawDraftContentState;
  originalText: string;
  synopsis: Synopsis[]
}

export interface SublinePair {
  sourceIndex: number;  // Index in current line
  targetIndex: number;  // Index in target line
}

export class InternalParallelLink {
  linkText?: string;
  tractate: string;
  chapter: string;
  mishna: string;
  lineNumber: string;
  sublinePairs?: SublinePair[]; // Array of matched subline pairs
}

export class Line {
  originalLineNumber?: string;
  lineNumber?: string;
  sourceReference?: string;

  parallels?: InternalParallelLink[]

  @IsNotEmpty()
  @IsString()
  mainLine: string;

  sublines?: SubLine[]

  @IsString()
  sugiaName: string;

};



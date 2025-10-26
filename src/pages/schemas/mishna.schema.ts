import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, SchemaTypes, Types } from 'mongoose';
import { Line, SubLine } from '../models/line.model';
import { MishnaLink } from '../models/mishna.link.model';
import { MishnaExcerpt } from '../models/mishna.excerpt.model';
import * as _ from 'lodash';
import { RawDraftContentState } from 'draft-js';
import { ExcerptUtils } from '../inc/excerptUtils';
import { createSublineFromLine } from './lineMethods/createSublineFromLine';

// Interface for the Mishna model with custom static methods
export interface MishnaModel extends Model<Mishna> {
  findLineByLink(
    tractate: string,
    chapter: string,
    mishna: string,
    lineNumber: string
  ): Promise<Line | undefined>;
}

@Schema({
  minimize: false
})
export class Mishna extends Document {
  @Prop()
  guid: string;

  @Prop()
  tractate: string;

  @Prop()
  chapter: string;

  @Prop()
  mishna: string;

  @Prop()
  lines: Line[];

  @Prop({ type: SchemaTypes.Mixed })
  richTextMishna: RawDraftContentState;

  @Prop({ type: SchemaTypes.Mixed })
  richTextTosefta: RawDraftContentState;

  @Prop({ type: SchemaTypes.Mixed })
  richTextBavli: RawDraftContentState;

  @Prop()
  previous?: MishnaLink;

  @Prop()
  next?: MishnaLink;

  @Prop({ default: [] })
  excerpts?: MishnaExcerpt[];

  updateSublinesIndex: () => void;
  updateExcerpts: () => void;
  getLineText: (index: number) => string;
  getLine: (lineNumber: string) => Line|undefined;
  getSublines: () => SubLine[];
  getSubline: (index: number) => [SubLine, number];
  getLineOfSubline: (subline: SubLine) => Line;
  normalizeLines: (eachLine: (line: Line) => void) => Promise<void>;
  normalizeExcerpts: (
    eachExcerpt: (excerpt: MishnaExcerpt, mishna: Mishna) => void,
  ) => Promise<void>;
  createSublineFromLine: () => void;

}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);

MishnaSchema.methods.getSublines = function(): SubLine[] {
  const sublines = this.lines.map(line => line.sublines);
  return _.flatten(sublines);
};

MishnaSchema.methods.getLineOfSubline = function(subline: SubLine): Line {
  const line = this.lines.find(l => {
    const foundSubline = l.sublines.findIndex(s => s.index === subline.index);
    return foundSubline !== -1;
  });
  return line;
};

MishnaSchema.methods.getSubline = function(index): [SubLine, number] {
  const sublines = this.getSublines();
  const subline = sublines.find(s => s.index === index);
  const lineOfSubline = this.getLineOfSubline(subline);
  const indexInArray = lineOfSubline.sublines.findIndex(
    s => s.index === subline.index,
  );

  return [subline, indexInArray];
};

MishnaSchema.methods.updateSublinesIndex = function(): void {
  let index = 1;
  this.lines.forEach(line => {
    line.sublines.forEach(subline => {
      subline.index = index++;
    });
  });
  this.markModified('lines');
};

MishnaSchema.methods.getLineText = function(index: number): string {
  const line = this.lines[index];
  return line.sublines.reduce((carry, subline) => {
    return carry + ' ' + subline.text;
  }, '');
};

// find excerpt that select the line that was updated

MishnaSchema.methods.updateExcerpts = function(): void {
  for (let i = 0; i < this.excerpts.length; i++) {
    const excerpt = this.excerpts[i];
    const fromLine = this.lines[excerpt.selection.fromLine];
    const toLine = this.lines[excerpt.selection.toLine];
    const fromWord = excerpt.selection.fromWord;
    const toWord = excerpt.selection.toWord;
    try {
      new ExcerptUtils(excerpt).updateExcerptSubline(fromLine, toLine);
      console.log('updated ', excerpt);
    } catch (e) {
      console.log(e, excerpt);
    }

    this.markModified('excerpts');
  }
};

MishnaSchema.methods.normalizeLines = async function(
  normalizeLine: (line: Line) => Line,
): Promise<void> {
  for (let i = 0; i < this.lines.length; i++) {
    console.log('Normalizing line ', i);
    this.lines[i] = normalizeLine(this.lines[i]);
  }
  this.markModified('lines');
  await this.save();
};

MishnaSchema.methods.normalizeExcerpts = async function(
  normalizeExcerpt: (excerpt: MishnaExcerpt, mishna: Mishna) => MishnaExcerpt,
): Promise<void> {
  for (let i = 0; i < this.excerpts.length; i++) {
    console.log('Normalizing excerpt ', i);
    this.excerpts[i] = normalizeExcerpt(this.excerpts[i], this);
  }
  this.markModified('excerpts');
  await this.save();
};

MishnaSchema.methods.getLine =  function (lineNumber: string): Line|undefined {
  return this.lines.find(l => l.lineNumber === lineNumber)
};

// Efficient static method to fetch only a specific line
MishnaSchema.statics.findLineByLink = async function(tractate: string, chapter: string, mishna: string, lineNumber: string) {
  const result = await this.findOne(
    { tractate, chapter, mishna, 'lines.lineNumber': lineNumber },
    { 'lines.$': 1 }
  ).exec();
  return result?.lines?.[0];
};

MishnaSchema.methods.createSublineFromLine = createSublineFromLine

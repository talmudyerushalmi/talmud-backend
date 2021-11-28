import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Line, SubLine } from '../models/line.model';
import { ObjectID } from 'mongodb';
import { MishnaLink } from '../models/mishna.link.model';
import { MishnaExcerpt } from '../models/mishna.excerpt.model';
import { ExcerptSelection } from '../models/excerptSelection.model';
import * as _ from 'lodash';
import { RawDraftContentState } from 'draft-js';
 
@Schema()
export class Mishna extends Document {

  @Prop()
  _id: ObjectID;

  @Prop()
  id: string;

  @Prop()
  tractate: string;

  @Prop()
  chapter: string;

  @Prop()
  mishna: string;

  @Prop()
  lines: Line[];

  @Prop({type: SchemaTypes.Mixed})
  richTextMishna: RawDraftContentState;

  @Prop()
  previous?: MishnaLink

  @Prop()
  next?: MishnaLink

  @Prop({default: []})
  excerpts?: MishnaExcerpt[]

  updateSublines: ()=>void
  updateExcerpts: ()=>void
  getSublines: ()=> SubLine[]
  getSubline: (index: number)=> [SubLine, number]
  getLineOfSubline: (subline: SubLine) => Line
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);


MishnaSchema.methods.getSublines = function (): SubLine[] {
  const sublines = this.lines.map(line => line.sublines)
  return _.flatten(sublines);
}

MishnaSchema.methods.getLineOfSubline = function (subline: SubLine): Line {
  const line = this.lines.find(l => {
     const foundSubline = l.sublines.findIndex(s => s.index === subline.index);
     return foundSubline !== -1
  });
  return line;
}

MishnaSchema.methods.getSubline = function (index): [SubLine,number] {
  const sublines = this.getSublines();
  const subline = sublines.find(s => s.index === index);
  const lineOfSubline = this.getLineOfSubline(subline)
  const indexInArray = lineOfSubline.sublines.findIndex(s => s.index===subline.index);
  
  return [subline, indexInArray];
}


MishnaSchema.methods.updateSublines = function (): void {
  let index = 1;
  this.lines.forEach(line => {
    line.sublines.forEach(subline => {
      subline.index = index++;
    })
  })
  this.markModified('lines');
};

MishnaSchema.methods.updateExcerpts = function (): void {
    for (let i = 0; i < this.excerpts.length; i++) {
        const excerpt = this.excerpts[i];
        const fromLine = this.lines[excerpt.selection.fromLine];
        const toLine = this.lines[excerpt.selection.toLine];
        const s =  new ExcerptSelection(excerpt.selection);
        s.updateSublines(fromLine,toLine);
        excerpt.selection = s;
      }
      this.markModified('excerpts');
    }
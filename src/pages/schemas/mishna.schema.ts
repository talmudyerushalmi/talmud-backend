import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Line, SubLine } from '../models/line.model';
import { ObjectID } from 'mongodb';
import { MishnaLink } from '../models/mishna.link.model';
import { MishnaExcerpt } from '../models/mishna.excerpt.model';
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
  normalizeLines: (eachLine:(line:Line)=>void)=>Promise<void>
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

// find excerpt that select the line that was updated

MishnaSchema.methods.updateExcerpts = function (): void {
    // for (let i = 0; i < this.excerpts.length; i++) {
    //     const excerpt = this.excerpts[i];
    //     const fromLine = excerpt.selection.fromLine;
    //     const toLine = excerpt.selection.toLine;
    //     const fromWord = excerpt.selection.fromWord;
    //     const toWord = excerpt.selection.toWord;
    //     let fromSubline = this.lines[fromLine].sublines.find(l => l.text.indexOf(fromWord)!==-1)
    //     if (!fromSubline) {
    //         fromSubline = this.lines[fromLine].sublines[0]
    //     }
    //     let toSubline = this.lines[toLine].sublines.find(l => l.text.indexOf(toWord)!==-1)
    //     if (!toSubline) {
    //         toSubline = this.lines[toLine].sublines[0]
    //     }
    //     excerpt.selection.fromSubline = fromSubline?.index;
    //     excerpt.selection.toSubline = toSubline?.index;
    //   }
    //   this.markModified('excerpts');
    }

MishnaSchema.methods.normalizeLines = async function (normalizeLine:(line:Line)=>Line): Promise<void> {
      for (let i = 0; i < this.lines.length; i++) {
         console.log('Normalizing line ',i)
         this.lines[i] = normalizeLine(this.lines[i])
      }
      this.markModified('lines');
      await this.save();
    }
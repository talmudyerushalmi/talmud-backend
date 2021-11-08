import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Line, SubLine } from '../models/line.model';
import { ObjectID } from 'mongodb';
import { MishnaLink } from '../models/mishna.link.model';
import { MishnaExcerpt } from '../models/mishna.excerpt.model';
import * as _ from 'lodash';
 
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

  @Prop()
  previous?: MishnaLink

  @Prop()
  next?: MishnaLink

  @Prop({default: []})
  excerpts?: MishnaExcerpt[]

  updateSublines: ()=>void
  updateExcerpts: ()=>void
  getSublines: ()=> SubLine[]
}

export const MishnaSchema = SchemaFactory.createForClass(Mishna);


MishnaSchema.methods.getSublines = function (): SubLine[] {
  const sublines = this.lines.map(line => line.sublines)
  return _.flatten(sublines);
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
        const fromLine = excerpt.selection.fromLine;
        const toLine = excerpt.selection.toLine;
        const fromWord = excerpt.selection.fromWord;
        const toWord = excerpt.selection.toWord;
        let fromSubline = this.lines[fromLine].sublines.find(l => l.text.indexOf(fromWord)!==-1)
        if (!fromSubline) {
            fromSubline = this.lines[fromLine].sublines[0]
        }
        let toSubline = this.lines[toLine].sublines.find(l => l.text.indexOf(toWord)!==-1)
        if (!toSubline) {
            toSubline = this.lines[toLine].sublines[0]
        }
        excerpt.selection.fromSubline = fromSubline?.index;
        excerpt.selection.toSubline = toSubline?.index;
      }
      this.markModified('excerpts');
    }
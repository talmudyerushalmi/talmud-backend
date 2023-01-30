import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Mishna } from './schemas/mishna.schema';
import { Model, QueryWithHelpers } from 'mongoose';
import { LineMarkDto } from './dto/line-mark.dto';
import * as numeral from 'numeral';
import { SaveMishnaExcerptDto } from './dto/save-mishna-excerpt.dto';
import { ExcerptUtils } from './inc/excerptUtils';
import { InternalLink } from './models/line.model';

@Injectable()
export class MishnaRepository {
  constructor(@InjectModel(Mishna.name) private mishnaModel: Model<Mishna>) {}

  getGUID(tractate: string, chapter: string, mishna: string): string {
    return `${tractate}_${chapter}_${mishna}`;
  }

  find(
    tractate: string,
    chapter: string,
    mishna: string,
  ): QueryWithHelpers<Mishna, any> {
    const guid = this.getGUID(tractate, chapter, mishna);
    return this.mishnaModel.findOne({ guid });
  }

  getAllChapter(
    tractate: string,
    chapter: string,
  ): QueryWithHelpers<Mishna[], any> {
    return this.mishnaModel.find({
      tractate,
      chapter,
    });
  }

  findByLine(tractate: string, line: string): QueryWithHelpers<Mishna, any> {
    return this.mishnaModel.findOne({ tractate, 'lines.lineNumber': line });
  }
  getRangeLines(
    tractate: string,
    fromLine: string,
    toLine: string,
  ): QueryWithHelpers<Mishna[], any> {
    const from = parseInt(fromLine);
    const to = parseInt(toLine);
    const values = [];
    for (let i = from; i <= to; i++) {
      const line = numeral(i).format('00000');
      values.push(line);
    }
    return this.mishnaModel
      .find({ tractate: tractate.trim(), 'lines.lineNumber': { $in: values } })
      .lean();
  }

  // for import
  getAll(): QueryWithHelpers<Mishna[], any> {
    return this.mishnaModel.find({});
  }

  async forEachMishna(
    cb: (mishna: Mishna) => Promise<void>,
    tractate?: string,
  ): Promise<void> {
    const mishnaiot = tractate
      ? await this.getAllForTractate(tractate)
      : await this.getAll();
    await Promise.all(mishnaiot.map(mishna => cb(mishna)));
  }

  getAllForTractate(tractate: string): QueryWithHelpers<Mishna[], any> {
    return this.mishnaModel.find(
      {
        tractate,
      },
      null,
      { sort: { chapter: 1 } },
    );
  }

  async deleteImportedExcerpts(tractate: string): Promise<void> {
    const all = await this.getAllForTractate(tractate);

    for (const mishna of all) {
      mishna.excerpts = mishna.excerpts.filter(e => !e.automaticImport);
      mishna.markModified('excerpts');
      await mishna.save();
    }
  }
  async updateExcerptsWithSublineSelect(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<any> {
    const mishnaDoc = await this.find(tractate, chapter, mishna);
    const excerpts = mishnaDoc.excerpts;
    for (let i = 0; i < excerpts.length; i++) {
      const excerpt = excerpts[i];
      const fromLine = excerpt.selection.fromLine;
      const toLine = excerpt.selection.toLine;
      const fromWord = excerpt.selection.fromWord;
      const toWord = excerpt.selection.toWord;
      let fromSubline = mishnaDoc.lines[fromLine].sublines.find(
        l => l.text.indexOf(fromWord) !== -1,
      );
      if (!fromSubline) {
        fromSubline = mishnaDoc.lines[fromLine].sublines[0];
      }
      let toSubline = mishnaDoc.lines[toLine].sublines.find(
        l => l.text.indexOf(toWord) !== -1,
      );
      if (!toSubline) {
        toSubline = mishnaDoc.lines[toLine].sublines[0];
      }
      excerpt.selection.fromSubline = fromSubline?.index;
      excerpt.selection.toSubline = toSubline?.index;
      await this.saveExcerpt(tractate, chapter, mishna, excerpt);

      console.log(
        'checking',
        mishnaDoc.id,
        excerpts[i].selection,
        ' line',
        `${fromSubline?.index} - ${toSubline?.index}`,
      );
    }

    return 'ok';
  }
  updateExcerptsWithSublineSelect2(mishnaDoc: Mishna): void {
    const excerpts = mishnaDoc.excerpts;
    for (let i = 0; i < excerpts.length; i++) {
      // const excerpt = excerpts[i];
      // const fromLine = excerpt.selection.fromLine;
      // const toLine = excerpt.selection.toLine;
      // const fromWord = excerpt.selection.fromWord;
      // const toWord = excerpt.selection.toWord;
      // let fromSubline = mishnaDoc.lines[fromLine].sublines.find(l => l.text.indexOf(fromWord)!==-1)
      // if (!fromSubline) {
      //     fromSubline = mishnaDoc.lines[fromLine].sublines[0]
      // }
      // let toSubline = mishnaDoc.lines[toLine].sublines.find(l => l.text.indexOf(toWord)!==-1)
      // if (!toSubline) {
      //     toSubline = mishnaDoc.lines[toLine].sublines[0]
      // }
      // excerpt.selection.fromSubline = fromSubline?.index;
      // excerpt.selection.toSubline = toSubline?.index;
    }
  }

  async saveExcerpt(
    tractate: string,
    chapter: string,
    mishna: string,
    excerptToSave: SaveMishnaExcerptDto,
  ): Promise<any> {
    const mishnaDoc = await this.find(tractate, chapter, mishna);
    const lineFrom = mishnaDoc.lines[excerptToSave.selection.fromLine];
    const lineTo = mishnaDoc.lines[excerptToSave.selection.toLine];
    new ExcerptUtils(excerptToSave).updateExcerptSubline(lineFrom, lineTo);
    if (excerptToSave.key) {
      const indexExcerpt = mishnaDoc.excerpts.findIndex(
        excerpt => excerpt.key === excerptToSave.key,
      );
      if (indexExcerpt !== -1) {
        mishnaDoc.excerpts[indexExcerpt] = excerptToSave;
      }
    } else {
      excerptToSave.key = Date.now();
      mishnaDoc.excerpts.push(excerptToSave);
    }

    mishnaDoc.markModified('excerpts');
    return mishnaDoc.save();
  }

  async deleteExcerpt(
    tractate: string,
    chapter: string,
    mishna: string,
    excerptKey: number,
  ): Promise<any> {
    const mishnaDoc = await this.find(tractate, chapter, mishna);
    if (mishnaDoc) {
      const newExcerpts = mishnaDoc.excerpts.filter(
        excerpt => excerpt.key !== excerptKey,
      );
      mishnaDoc.excerpts = newExcerpts;
      mishnaDoc.markModified('excerpts');
    }
    return mishnaDoc.save();
  }

  async getNextLine(lineMark: LineMarkDto): Promise<LineMarkDto> {
    const nextLine = numeral(parseInt(lineMark.line) + 1).format('00000');
    const mishnaDoc = await this.mishnaModel.findOne({
      tractate: lineMark.tractate,
      'lines.lineNumber': nextLine,
    });
    if (mishnaDoc) {
      return {
        tractate: lineMark.tractate,
        chapter: mishnaDoc.chapter,
        mishna: mishnaDoc.mishna,
        line: nextLine,
      };
    } else {
      console.log('NO NEXT LINE');
    }
  }

  async addParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallel: InternalLink,
  ): Promise<any> {
    console.log('saving ',this.getGUID(tractate, chapter, mishna) )
    return this.mishnaModel.updateOne(
      {
        guid: this.getGUID(tractate, chapter, mishna),
        'lines.lineNumber': line,
      },
      { $push: { 'lines.$.parallels': parallel } },
    );
  }

  async removeParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallel: InternalLink,
  ): Promise<any> {
    console.log('removing parallel from ', tractate,chapter,mishna,line, parallel)
    return this.mishnaModel.updateOne(
      {
        guid: this.getGUID(tractate, chapter, mishna),
        'lines.lineNumber': line,
      },
      { $pull: { 'lines.$.parallels': parallel } },
    );
  }
}

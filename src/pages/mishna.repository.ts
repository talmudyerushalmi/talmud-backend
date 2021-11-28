import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Mishna } from './schemas/mishna.schema';
import { Model, QueryWithHelpers } from 'mongoose';
import { LineMarkDto } from './dto/line-mark.dto';
import * as numeral from 'numeral';
import { SaveMishnaExcerptDto } from './dto/save-mishna-excerpt.dto';
import { MishnaExcerpt } from './models/mishna.excerpt.model'
import { ExcerptSelection } from './models/excerptSelection.model';
@Injectable()
export class MishnaRepository {
  constructor(@InjectModel(Mishna.name) private mishnaModel: Model<Mishna>) {}

  getID(tractate: string, chapter: string, mishna: string): string {
    return `${tractate}_${chapter}_${mishna}`;
  }

  find(
    tractate: string,
    chapter: string,
    mishna: string,
  ): QueryWithHelpers<Mishna, any> {
    const id = this.getID(tractate, chapter, mishna);
    return this.mishnaModel.findOne({ id });
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

  async forEachMishna(cb: (mishna:Mishna)=>(void)): Promise<void> {
    const mishnaiot = await this.getAll();
    for await (const mishna of mishnaiot) {
      cb(mishna)
    }
  }

  getAllForTractate(tractate: string): QueryWithHelpers<Mishna[], any> {
    return this.mishnaModel.find({
      tractate,
    });
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
        const fromLine = mishnaDoc.lines[excerpt.selection.fromLine];
        const toLine = mishnaDoc.lines[excerpt.selection.toLine];
        excerpt.selection = new ExcerptSelection(excerpt.selection).updateSublines(fromLine, toLine);
       
        await this.saveExcerpt(
            tractate,
            chapter,
            mishna,
            excerpt
        );

       // console.log('checking', mishnaDoc.id,excerpts[i].selection, ' line',`${fromSubline?.index} - ${toSubline?.index}`)
      }

    return 'ok';

  }

  async saveExcerpt(
    tractate: string,
    chapter: string,
    mishna: string,
    saveMishnaExcerptDto: SaveMishnaExcerptDto,
  ): Promise<any> {
    const excerptToSave = new MishnaExcerpt(saveMishnaExcerptDto);
    const mishnaDoc = await this.find(tractate, chapter, mishna);
    const fromLine = mishnaDoc.lines[excerptToSave.selection.fromLine]
    const toLine = mishnaDoc.lines[excerptToSave.selection.toLine]
    excerptToSave.selection.updateSublines(fromLine, toLine);

    if (excerptToSave.key) {
      const indexExcerpt = mishnaDoc.excerpts.findIndex(
        excerpt => excerpt.key === excerptToSave.key,
      );
      if (indexExcerpt !== -1) {
        mishnaDoc.excerpts[indexExcerpt] = excerptToSave;
        mishnaDoc.markModified('excerpts');
      }
    } else {
      excerptToSave.key = Date.now();
      mishnaDoc.excerpts.push(excerptToSave);
    }

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
}

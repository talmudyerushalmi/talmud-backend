import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { UpdateMishnaDto } from './dto/update-mishna.dto';
import { SetLineDto } from './dto/set-line.dto';
import { Mishna } from './schemas/mishna.schema';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { UpdateMishnaLineDto } from './dto/save-mishna-line.dto';
import { tractateSettings } from './inc/tractates.settings';
import { synopsisList } from './inc/tractates.synopsis';
import * as numeral from 'numeral';
import { MishnaLink } from './models/mishna.link.model';
import { create } from 'xmlbuilder2';

export interface iTractate {
  title_eng: string;
  title_heb: string;
}
@Injectable()
export class PagesService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  async getMishna(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<Mishna> {
    return this.mishnaRepository.find(tractate, chapter, mishna).lean();
  }

  async getMishnaTEI(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<any> {
    const m = await this.mishnaRepository.find(tractate, chapter, mishna);
    const root = create().ele('tei').att('xmls','http://www.tei-c.org/ns/1.0');
    root.ele('teiHeader')
      .ele('titleStmt')
        .ele('title').txt('Talmud Yerushalmi - Digital Critical Edition').up()
        .ele('respStmt')
          .ele('name').txt('Prof. Menachem Katz').up()
          .ele('resp').txt('Editor').up().up()
        .ele('respStmt')
          .ele('name').txt('Dr. Hillel Gershuni').up()
          .ele('resp').txt('Editor').up().up()
        .ele('respStmt')
          .ele('name').txt('Yaron Bar').up()
          .ele('resp').txt('Developer').up().up()
      .up()


    const text = root.ele('text');

      m.lines.forEach( l => {
            const lineTEI = text.ele('l');
            if (l.sugiaName) {
              text.ele('title').att('type','sub').txt(l.sugiaName)
            }
            l.sublines.forEach((subline) => {
              const sublineTEI = lineTEI.ele('s');

              const appTEI = sublineTEI.ele('app');

              appTEI.ele('lem').txt(subline.text)
              subline.synopsis.forEach(synopsis =>{
                if (synopsis.text.simpleText) {
                  appTEI.ele('rdg')
                  .att('wit',`#${synopsis.id}`)
                  .txt(synopsis.text.simpleText)
                }
              })
            });


          })

// convert the XML tree to string
const xml = root.end({ prettyPrint: true });


    return xml;
  }

  async getChapter(tractate: string, chapter: string, mishna = 1): Promise<any> {
    const mishnaiot = await this.mishnaRepository.getAllChapter(tractate, chapter);
    const mishnaDocument = mishnaiot[mishna-1]
    if (!mishnaDocument) {
      throw new BadRequestException('Mishna not found');
    }
    const richTextsMishnas = mishnaiot.map((m: Mishna) => {
      return {
      mishna: m.mishna,  
      richTextMishna: m.richTextMishna
    }})

    return {
      tractate,
      chapter,
      totalMishnaiot: mishnaiot.length,
      richTextsMishnas,
      //@ts-ignore
      mishnaDocument: {...mishnaDocument._doc},
      mishna
    };
  }

  async saveMishna(
    guid: string,
    updateMishnaDto: UpdateMishnaDto,
  ): Promise<Mishna> {
    const filter = {
      guid,
    };
    return this.mishnaModel
      .findOneAndUpdate(filter, updateMishnaDto, { new: true })
      .lean();
  }

  async getTractate(tractate: string): Promise<Tractate> {
    return this.tractateRepository.get(tractate);
  }

  async getAllTractates(): Promise<any> {
    return this.tractateRepository.getAll();
  }

  getTractateSettings(tractate: string): any {
    return {
      ...tractateSettings[tractate],
      synopsisList,
    };
  }

  getChapterId(tractate: string, chapter: string, mishna: string): string {
    return `${tractate}_${chapter}_${mishna}`;
  }
  async upsertMishna(
    tractate: string,
    chapter: string,
    mishna: string,
    createMishnaDto: CreateMishnaDto,
  ): Promise<Mishna> {
    const guid = this.mishnaRepository.getGUID(tractate, chapter, mishna);

    const mishnaDocument = await this.mishnaModel.findOneAndUpdate(
      { guid },
      {
        guid,
        tractate,
        chapter,
        mishna,
        ...createMishnaDto,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
    return mishnaDocument;
  }

  async updateMishnaInTractate(mishnaDocument: Mishna): Promise<void> {
    // get tractate
    const tractateDocument = await this.tractateRepository.upsert(
      mishnaDocument.tractate,
    );
    this.tractateRepository.addMishnaToChapter(
      tractateDocument,
      mishnaDocument,
    );
    await tractateDocument.save();
  }

  async updatePage(updateMishnaDto: UpdateMishnaDto) {
    return {
      updateMishnaDto,
    };
  }

  async setLine(
    tractate: iTractate,
    chapter: string,
    mishna: string,
    setLineDto: SetLineDto,
  ): Promise<void> {
    const mishnaDocument = await this.upsertMishna(
      tractate.title_eng,
      chapter,
      mishna,
      {},
    );
    const found = mishnaDocument.lines.findIndex(
      line => line.lineNumber === setLineDto.line,
    );
    if (found !== -1) {
      // console.log('found ', found);
      mishnaDocument.lines[found] = {
        lineNumber: setLineDto.line,
        mainLine: setLineDto.text,
        sugiaName: undefined,
      };
    } else {
      mishnaDocument.lines.push({
        lineNumber: setLineDto.line,
        originalLineNumber: setLineDto.originalLineNumber,
        mainLine: setLineDto.text,
        sugiaName: undefined,
      });
      mishnaDocument.lines = _.orderBy(
        mishnaDocument.lines,
        ['lineNumber'],
        ['asc'],
      );
    }
    mishnaDocument.previous = {
      tractate: tractate.title_eng,
      chapter,
      mishna,
    };
    mishnaDocument.next = {
      tractate: tractate.title_eng,
      chapter,
      mishna,
    };
    await mishnaDocument.save();

    // now update reference in tractate
    await this.updateMishnaInTractate(mishnaDocument);
  }

  async updateMishnaLine(
    tractate: string,
    line: string,
    updateMishnaLine: UpdateMishnaLineDto,
  ): Promise<any> {
    const mishnaDoc = await this.mishnaModel.findOne({
      tractate,
      'lines.lineNumber': line,
    });
    const lineIndex = mishnaDoc.lines.findIndex(
      lineItem => lineItem.lineNumber === line,
    );
    mishnaDoc.lines[lineIndex].sublines = updateMishnaLine.sublines;
    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }

  async getPreviousMishna(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<MishnaLink> {
    if (mishna === '001' && chapter === '001') {
      return null;
    }

    // need to find first existing mishna (sometimes a mishna is missing so we need to repeat the search)
    if (mishna !== '001') {
      let previousMishna = null;
      let tryMishna = numeral(parseInt(mishna) - 1).format('000');
      while (tryMishna !== '000' && !previousMishna) {
        previousMishna = await this.mishnaRepository.find(
          tractate,
          chapter,
          tryMishna,
        );
        // not found, continue looking
        if (!previousMishna) {
          tryMishna = numeral(parseInt(tryMishna) - 1).format('000');
        }
      }

      if (previousMishna) {
        const lineFrom = previousMishna.lines[0].lineNumber;
        const lineTo =
          previousMishna.lines[previousMishna.lines.length - 1].lineNumber;
        return {
          tractate,
          chapter,
          mishna: tryMishna,
          lineFrom,
          lineTo,
        };
      }
    }
    // if need to go back one chapter
    const tractateDoc = await this.tractateRepository.get(tractate, true);
    const sortedLastDown = tractateDoc.chapters.sort(
      (a, b) => parseInt(b.id) - parseInt(a.id),
    );

    const previousChapter = sortedLastDown.find(
      c => parseInt(c.id) < parseInt(chapter),
    );
    if (!previousChapter) {
      return null;
    }
    const lastMishnaInPreviousChapter =
      previousChapter.mishnaiot[previousChapter.mishnaiot.length - 1];
    const previousMishna = await this.mishnaRepository.find(
      tractate,
      previousChapter.id,
      lastMishnaInPreviousChapter.mishna,
    );
    if (previousMishna) {
      const lineFrom = previousMishna.lines[0].lineNumber;
      const lineTo =
        previousMishna.lines[previousMishna.lines.length - 1].lineNumber;
      return {
        tractate,
        chapter: previousChapter.id,
        mishna: lastMishnaInPreviousChapter.mishna,
        lineFrom,
        lineTo,
      };
    }
  }

  async getNextMishna(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<MishnaLink> {
    let nextChapter = chapter;
    let nextMishnaDoc = null;
    let nextMishna = mishna;
    const currentMishnaiot = (
      await this.tractateRepository.get(tractate, true)
    ).chapters.find(c => c.id === chapter).mishnaiot;

    // while can traverse the mishnaiot
    while (
      currentMishnaiot.some(m => parseInt(m.mishna) > parseInt(nextMishna)) &&
      !nextMishnaDoc
    ) {
      // increment mishna
      nextMishna = numeral(parseInt(nextMishna) + 1).format('000');
      nextMishnaDoc = await this.mishnaRepository.find(
        tractate,
        chapter,
        nextMishna,
      );
    }
    if (!nextMishnaDoc) {
      // increment a chapter
      nextChapter = numeral(parseInt(chapter) + 1).format('000');
      nextMishna = '001';
      nextMishnaDoc = await this.mishnaRepository.find(
        tractate,
        nextChapter,
        nextMishna,
      );
    }

    if (nextMishnaDoc) {
      const lineFrom = nextMishnaDoc.lines[0].lineNumber;
      const lineTo =
        nextMishnaDoc.lines[nextMishnaDoc.lines.length - 1].lineNumber;
      return {
        tractate,
        chapter: nextChapter,
        mishna: nextMishna,
        lineFrom,
        lineTo,
      };
    }
    return null;
  }
}

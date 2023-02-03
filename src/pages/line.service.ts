import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { InternalLink } from './models/line.model';
import MiscUtils from 'src/shared/MiscUtils';

@Injectable()
export class LineService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  async getLinkName(tractate: string, chapter: string, mishna: string, line: string) {
    const tractateName = (await this.tractateRepository.get(tractate)).title_heb;
    return `${tractateName} ${MiscUtils.hebrewMap.get(parseInt(chapter))} ${MiscUtils.hebrewMap.get(parseInt(mishna))} [${line}]`
  }

  async setParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallels: InternalLink[],
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
    const currentLine = mishnaDoc.lines[lineIndex];


    const added: InternalLink[] = _.differenceWith(parallels, currentLine.parallels, _.isEqual);
    const removed = _.differenceWith(
      currentLine.parallels,
      parallels,
      _.isEqual,
    );

    const name = (await this.tractateRepository.get(tractate)).title_heb;


    await Promise.all(
      parallels.map(async (p) => {
        p.linkText = await this.getLinkName(p.tractate, p.chapter, p.mishna, p.lineNumber)
      })
    )

    for await (const link of added) {
      const parallelLink: InternalLink = {
        linkText: await this.getLinkName(tractate, chapter, mishna, line),
        tractate,
        chapter,
        mishna,
        lineNumber: line,
      };

      await this.mishnaRepository.addParallel(
        link.tractate,
        link.chapter,
        link.mishna,
        link.lineNumber,
        parallelLink,
      );
    }

    for (const link of removed) {
      const parallelLink: InternalLink = {
        tractate,
        chapter,
        mishna,
        lineNumber: line,
      };
      await this.mishnaRepository.removeParallel(
        link.tractate,
        link.chapter,
        link.mishna,
        link.lineNumber,
        parallelLink,
      );
    }

    currentLine.parallels = parallels;

    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }
}

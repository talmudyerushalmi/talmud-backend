import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { iTractate } from './pages.service';
import { InternalLink } from './models/line.model';
import MiscUtils from '../shared/MiscUtils';

export enum LinkFormat {
  TractateChapterMishna = 'TractateChapterMishna',
}
@Injectable()
export class NavigationService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}


  async getAllTractates(): Promise<iTractate[]> {
    return this.tractateRepository.getAll();
  }

  async getMishnaForNavigation(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<any> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    if (!mishnaDoc) {
      throw new HttpException('Could not find mishna', 404);
    }
    const lines = mishnaDoc?.lines.map(l => {
      return { lineNumber: l.lineNumber, mainLine: l.mainLine };
    });
    return {
      mishna: mishnaDoc.mishna,
      id: mishnaDoc.guid,
      lines,
      previous: mishnaDoc.previous,
      next: mishnaDoc.next,
    };
  }

  async getLinesForNavigation(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<string[]> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lines = mishnaDoc.lines.map(l => {
      return l.lineNumber;
    });

    return lines;
  }

 
  getLinkText(
    link: InternalLink,
    format = LinkFormat.TractateChapterMishna,
  ) {
    switch (format) {
      case LinkFormat.TractateChapterMishna:
      default:
        const tractate = this.tractateRepository.getCachedTractate(link.tractate)        
        return `${tractate.title_heb} ${MiscUtils.hebrewMap.get(parseInt(link.chapter))} ${MiscUtils.hebrewMap.get(parseInt(link.mishna))}`;
    }
  }
}

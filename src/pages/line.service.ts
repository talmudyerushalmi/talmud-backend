import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { InternalParallelLink, Line } from './models/line.model';
import MiscUtils from '../shared/MiscUtils';
import { compareSynopsis, filterParallelSynopsis, getSynopsisText } from './inc/synopsisUtils';
import { SynopsisService } from './synopsis.service';

@Injectable()
export class LineService {
  constructor(
    private synopsisService: SynopsisService,
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  async getLinkName(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallelLink?: InternalParallelLink,
  ) {
    const tractateDoc = await this.tractateRepository.get(tractate);
    const tractateName = tractateDoc?.title_heb || tractate;
    console.log(`🔍 getLinkName: tractate=${tractate}, Hebrew=${tractateName}`);
    
    // Keep it simple - just the basic reference without subline pair details
    const linkText = `${tractateName} ${MiscUtils.hebrewMap.get(
      parseInt(chapter),
    )} ${MiscUtils.hebrewMap.get(parseInt(mishna))} [${line}]`;
    
    console.log(`🔍 Generated linkText: ${linkText}`);
    return linkText;
  }

  findFirstMatch(line1, line2: Line) {
    for (let i = 0; i < line1.sublines.length; i++) {
      const text1 = getSynopsisText(line1.sublines[i], 'leiden');
      for (let j = 0; j < line2.sublines.length; j++) {
        const text2 = line2.sublines[j].text;

        console.log(
          'original ',
          text1
            .split('')
            .reverse()
            .join(''),
        );
        console.log(
          'parallels ',
          text2
            .split('')
            .reverse()
            .join(''),
        );
         compareSynopsis(text1, text2)

      }
    }
  }
  async updateLineParallels(
    mishnaDoc: Mishna,
    lineNumber: string,
  ): Promise<Mishna> {
    const line = mishnaDoc.getLine(lineNumber);
    if (!line.parallels) {
      return;
    }

    console.log(lineNumber)
    filterParallelSynopsis(line);
    for (const parallel of line?.parallels) {
      const parallelLine = await this.mishnaRepository.findByLink(parallel);
      try {
        this.synopsisService.copyParallelSynopsis(line, parallelLine, parallel)

      }
      catch (e){
       // console.log('err',e)
      }

     // this.findFirstMatch(line, parallelLine)


      // try {
      //   this.findFirstMatch(line, parallelLine);
      // } catch (e) {
      //   console.log('err', e);
      // }
    }

    return mishnaDoc;
  }

  async setParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallels: InternalParallelLink[],
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
    const currentLine = mishnaDoc.lines[lineIndex];

    const added: InternalParallelLink[] = _.differenceWith(
      parallels,
      currentLine.parallels || [],
      _.isEqual,
    );
    const removed = _.differenceWith(
      currentLine.parallels || [],
      parallels,
      _.isEqual,
    );

    const name = (await this.tractateRepository.get(tractate)).title_heb;

    // Generate clean Hebrew linkText for each parallel
    await Promise.all(
      parallels.map(async p => {
        p.linkText = await this.getLinkName(
          p.tractate,
          p.chapter,
          p.mishna,
          p.lineNumber,
        );
      }),
    );

    for await (const link of added) {
      const parallelLink: InternalParallelLink = {
        tractate,
        chapter,
        mishna,
        lineNumber: line,
        sublinePairs: link.sublinePairs || [],
      };
      
      // Generate clean Hebrew linkText
      parallelLink.linkText = await this.getLinkName(tractate, chapter, mishna, line);

      await this.mishnaRepository.addParallel(
        link.tractate,
        link.chapter,
        link.mishna,
        link.lineNumber,
        parallelLink,
      );
    }

    for (const link of removed) {
      const parallelLink: InternalParallelLink = {
        tractate,
        chapter,
        mishna,
        lineNumber: line,
        sublinePairs: link.sublinePairs || [],
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

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
    
    // Keep it simple - just the basic reference without subline pair details
    const linkText = `${tractateName} ${MiscUtils.hebrewMap.get(
      parseInt(chapter),
    )} ${MiscUtils.hebrewMap.get(parseInt(mishna))} [${line}]`;
    
    return linkText;
  }

  findFirstMatch(line1, line2: Line) {
    for (let i = 0; i < line1.sublines.length; i++) {
      const text1 = getSynopsisText(line1.sublines[i], 'leiden');
      for (let j = 0; j < line2.sublines.length; j++) {
        const text2 = line2.sublines[j].text;

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

    // SIMPLIFIED APPROACH: Remove specific old reciprocals, then add all new ones
    
    // Step 1: Remove only the reciprocals that point back to THIS line (from the OLD parallels)
    const oldParallels = currentLine.parallels || [];
    for await (const oldParallel of oldParallels) {
      // Skip same-mishna parallels (frontend handles them)
      const isSameMishna = oldParallel.tractate === tractate && 
                          oldParallel.chapter === chapter && 
                          oldParallel.mishna === mishna;
      
      if (isSameMishna) {
        continue;
      }

      // Remove only the reciprocal that points back to THIS line
      await this.mishnaRepository.removeParallel(
        oldParallel.tractate,
        oldParallel.chapter,
        oldParallel.mishna,
        oldParallel.lineNumber,
        { tractate, chapter, mishna, lineNumber: line, sublinePairs: [] }
      );
    }

    // Step 2: Save the updated parallels to the current line
    currentLine.parallels = parallels;
    
    // Step 3: Add all new reciprocals
    for await (const newParallel of parallels) {
      // Skip same-mishna parallels (frontend handles them)
      const isSameMishna = newParallel.tractate === tractate && 
                          newParallel.chapter === chapter && 
                          newParallel.mishna === mishna;
      
      if (isSameMishna) {
        continue;
      }

      // Create reciprocal with inverted sublinePairs
      const invertedSublinePairs = newParallel.sublinePairs?.map(pair => ({
        sourceIndex: pair.targetIndex,
        targetIndex: pair.sourceIndex
      })) || [];
      
      const reciprocalParallel: InternalParallelLink = {
        tractate,
        chapter,
        mishna,
        lineNumber: line,
        sublinePairs: invertedSublinePairs,
        linkText: await this.getLinkName(tractate, chapter, mishna, line)
      };

      await this.mishnaRepository.addParallel(
        newParallel.tractate,
        newParallel.chapter,
        newParallel.mishna,
        newParallel.lineNumber,
        reciprocalParallel,
      );
    }

    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }
}

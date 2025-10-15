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
export class ParallelService {
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
      } catch (e) {
        // Handle error silently
      }
    }

    return mishnaDoc;
  }

  /**
   * Add a single parallel relationship (with reciprocal)
   */
  async addParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallel: InternalParallelLink,
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
    const currentLine = mishnaDoc.lines[lineIndex];

    // Generate Hebrew linkText for the parallel
    parallel.linkText = await this.getLinkName(
      parallel.tractate,
      parallel.chapter,
      parallel.mishna,
      parallel.lineNumber,
    );

    // Add to current line
    if (!currentLine.parallels) {
      currentLine.parallels = [];
    }
    currentLine.parallels.push(parallel);

    // Create reciprocal (skip if same-mishna - frontend handles it)
    const isSameMishna = parallel.tractate === tractate && 
                        parallel.chapter === chapter && 
                        parallel.mishna === mishna;
    
    if (!isSameMishna) {
      const invertedSublinePairs = parallel.sublinePairs?.map(pair => ({
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
        parallel.tractate,
        parallel.chapter,
        parallel.mishna,
        parallel.lineNumber,
        reciprocalParallel,
      );
    }

    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }

  /**
   * Delete a single parallel relationship (with reciprocal)
   */
  async deleteParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallelToDelete: InternalParallelLink,
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
    const currentLine = mishnaDoc.lines[lineIndex];

    // Remove from current line
    if (currentLine.parallels) {
      currentLine.parallels = currentLine.parallels.filter(p => 
        !(p.tractate === parallelToDelete.tractate &&
          p.chapter === parallelToDelete.chapter &&
          p.mishna === parallelToDelete.mishna &&
          p.lineNumber === parallelToDelete.lineNumber)
      );
    }

    // Remove reciprocal (skip if same-mishna - frontend handles it)
    const isSameMishna = parallelToDelete.tractate === tractate && 
                        parallelToDelete.chapter === chapter && 
                        parallelToDelete.mishna === mishna;
    
    if (!isSameMishna) {
      await this.mishnaRepository.removeParallel(
        parallelToDelete.tractate,
        parallelToDelete.chapter,
        parallelToDelete.mishna,
        parallelToDelete.lineNumber,
        { tractate, chapter, mishna, lineNumber: line, sublinePairs: [] }
      );
    }

    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }

  /**
   * Update a single parallel relationship (with reciprocal)
   */
  async updateParallel(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    oldParallel: InternalParallelLink,
    newParallel: InternalParallelLink,
  ): Promise<Mishna> {
    // For updates, we delete the old and add the new
    // This ensures reciprocals are properly updated
    await this.deleteParallel(tractate, chapter, mishna, line, oldParallel);
    return this.addParallel(tractate, chapter, mishna, line, newParallel);
  }
}

import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import { TractateRepository } from 'src/pages/tractate.repository';
import { MishnaRepository } from 'src/pages/mishna.repository';
import { CsvParser } from 'nest-csv-parser';
import { SettingsService } from 'src/settings/settings.service';

import { SublineService } from 'src/pages/subline.service';
import { Mishna } from 'src/pages/schemas/mishna.schema';
import { Line } from 'src/pages/models/line.model';
import { createEditorContentFromText } from 'src/pages/inc/editorUtils';
import { MishnaExcerpt } from 'src/pages/models/mishna.excerpt.model';
@Console()
@Injectable()
export class NormalizeService {
  constructor(
    private readonly csvParser: CsvParser,
    private pageService: PagesService,
    private tractateRepo: TractateRepository,
    private mishnaRepo: MishnaRepository,
    private settingsService: SettingsService,
    private sublineService: SublineService,
  ) {}


  @Command({
    command: 'normalize:nosach',
    description: 'Normalize nosach',
  })
  async NormalizeNosach(): Promise<void> {
    const normalizeLine = (l:Line)=>{
      if (!l.sublines) {
        return l;
      }
      l.sublines = l.sublines.map(subline=>{
       
          const cleanText = subline.text.replace(/[\n\r]+/g, '')
          return {
            ...subline,
            text: cleanText,
            nosach: createEditorContentFromText(cleanText)
          }
        
      })
      return l;
    };
    const normalizeNosach = async (m: Mishna) => {
      try {
        await m.normalizeLines(normalizeLine);
      }
      catch(e){
        console.log('Error in function: ',e)
      }
    }
    await this.mishnaRepo.forEachMishna(normalizeNosach)
  }
  @Command({
    command: 'normalize:excerpts',
    description: 'Normalize excerpts',
  })
  async NormalizeExcerpt(): Promise<void> {
    const normalizeExcerpt = (l:MishnaExcerpt, mishna: Mishna)=>{
      try {
        const fromLine = mishna.getLineText(l.selection.fromLine);
        const regex = new RegExp(l.selection.fromWord,"g");
        const fromWordTotal = (fromLine.match(regex) || []).length;
        l.selection.fromWordTotal = fromWordTotal;
        const toLine = mishna.getLineText(l.selection.toLine);
        const regexTo = new RegExp(l.selection.toWord,"g");
        const toWordTotal = (toLine.match(regexTo) || []).length;
        l.selection.toWordTotal = toWordTotal;
      }
      catch(e){
        console.log(`excerpt failure ${mishna.guid}`, l);
        l.flagNeedUpdate = true;
      }


      l.selection.fromWordOccurence = 1;
      l.selection.toWordOccurence = 1;
      return l;
    };
    const normalizeExcerpts = async (m: Mishna) => {
      try {
        await m.normalizeExcerpts(normalizeExcerpt);
      }
      catch(e){
        console.log('Error in function: ',e)
      }
    }
    await this.mishnaRepo.forEachMishna(normalizeExcerpts)
  }


}

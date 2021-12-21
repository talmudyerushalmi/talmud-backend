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
import { ExcerptUtils } from 'src/pages/inc/excerptUtils';
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
        l.selection.fromWord = ExcerptUtils.stripCharacters(l.selection.fromWord);
        l.selection.toWord = ExcerptUtils.stripCharacters(l.selection.toWord);
        const fromLine = mishna.lines[l.selection.fromLine]
        const fromLineText = mishna.getLineText(l.selection.fromLine);
        const fromWordTotal = ExcerptUtils.getWordsInText(fromLineText, l.selection.fromWord);
        l.selection.fromWordTotal = fromWordTotal;
        const toLine = mishna.lines[l.selection.toLine];
        const toLineText = mishna.getLineText(l.selection.toLine);
        const toWordTotal = ExcerptUtils.getWordsInText(toLineText, l.selection.toWord);
        l.selection.toWordTotal = toWordTotal;
        l.selection.fromWordOccurence = 1;
        l.selection.toWordOccurence = 1;

        const pattern = /[\(\)]/g;
        let allGood = true;
        if (fromLineText.indexOf(l.selection.fromWord)===-1) {
          const fromWord = ExcerptUtils.getWords(fromLineText)[0];
          if (fromWord.match(pattern)) {
            allGood = false;
          } else {
            l.selection.fromWord = fromWord
          }
        }
        if (toLineText.indexOf(l.selection.toWord)===-1) {
          const toWords =  ExcerptUtils.getWords(toLineText);
          const toWord = toWords[toWords.length-1];
          if (toWord.match(pattern)) {
            allGood = false;
          } else {
            l.selection.toWord = toWord
          }
        }
        if (allGood) {
          delete l.flagNeedUpdate;
        } else {
          l.flagNeedUpdate = true;
        }
        new ExcerptUtils(l).updateExcerptSubline(fromLine, toLine)
      }
      catch(e){
        console.log(`excerpt failure ${mishna.guid}`, l);
        l.flagNeedUpdate = true;
      }


     
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

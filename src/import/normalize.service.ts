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
import { createContentFromBlock, createEditorContentFromText } from 'src/pages/inc/editorUtils';
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
        if (subline.nosach) {
          return subline
        } else {
          const cleanText = subline.text.replace(/[\n\r]+/g, '')
          return {
            ...subline,
            nosach: createEditorContentFromText(cleanText)
          }
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


}

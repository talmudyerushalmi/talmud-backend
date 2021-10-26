import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import { TractateRepository } from 'src/pages/tractate.repository';
import { MishnaRepository } from 'src/pages/mishna.repository';
import { CsvParser } from 'nest-csv-parser';
import { SettingsService } from 'src/settings/settings.service';

import { SublineService } from 'src/pages/subline.service';
import { Mishna } from 'src/pages/schemas/mishna.schema';
@Console()
@Injectable()
export class ListService {
  constructor(
    private readonly csvParser: CsvParser,
    private pageService: PagesService,
    private tractateRepo: TractateRepository,
    private mishnaRepo: MishnaRepository,
    private settingsService: SettingsService,
    private sublineService: SublineService,
  ) {}


  @Command({
    command: 'list:empty-links',
    description: 'List empty links',
  })
  async listEmptyLinks(): Promise<void> {
    console.log('list empty links')
    const reverse = (str)=> str;
    const checkLinks = (m: Mishna) => {
      const emptyLinks = m?.excerpts.filter(e=> e.type!=='NOSACH' &&  (e.source === undefined ||
         e.source.title === undefined));
      emptyLinks.forEach(emptyLink => {
        console.log('missing: ', reverse(emptyLink.sourceLocation))
      })
    }
    await this.mishnaRepo.forEachMishna(checkLinks)
  }


}

import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';

@Console()
@Injectable()
export class ImportService {

  constructor(
    private pageService: PagesService
  ) {
  }


  @Command({
    command: 'import <filename>',
    description: 'Import tractate'
  })
  async import(filename:string){
    console.log('import ',filename)
    this.pageService.createPage2(filename);
  }

}

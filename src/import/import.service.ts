import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';

@Console()
@Injectable()
export class ImportService {


  @Command({
    command: 'import <filename>',
    description: 'Import tractate'
  })
  async import(filename:string){
    console.log('import ',filename)
  }

}

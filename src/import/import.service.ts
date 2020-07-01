import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import * as fs from 'fs';

@Console()
@Injectable()
export class ImportService {
  readonly metadata = /^(\d{12}) (\d{2})@ (.*)/;
  readonly structureRegex = /^(\d{2})(\d{4})(\d{3})(\d{3})/;
  readonly pageRegex = /\|([א-ת]),([א-ת])\|/;


  private data: string[];
  constructor(
    private pageService: PagesService
  ) {
  }


  readFile(filename: string) {
    this.data = fs.readFileSync(filename,
      {encoding:'utf8'})
      .split('\n');
  }
   reverseString(str) {
    return str.split("").reverse().join("");
  }
  async processLine(line,index) {
    if (index===0) {return;}
    console.log('processing ',index, '>\n');
    // read metadata
    const metaData = line.match(this.metadata);
    // fix problem with hebrew rtl
    if (!metaData) {return}

    const matchStructure = metaData[1].match(this.structureRegex);
    const [, line_no, piska, mishna, chapter] = matchStructure;
    let text = metaData[3];
    const pageMatch = text.match(this.pageRegex);
    if (pageMatch) {
      const [, daf,amud] = pageMatch;
      console.log(`PAGE daf: ${daf} amud:${amud}, `);
      text = text.replace(pageMatch[0],'');
    }
    console.log(`chapter ${chapter}, mishna: ${mishna}, line: ${piska}_${line_no}:`, this.reverseString(text));

    return this.pageService.setMainLine({
      chapter,
      mishna,
      line: `${piska}_${line_no}`,
      text
    });
  }

  @Command({
    command: 'import <filename>',
    description: 'Import tractate'
  })
  async import(filename:string){
    console.log('import ',filename);
    this.readFile(filename);

   // console.log('data ', this.data);
    const promises = [];
    this.data.forEach(
      (line,index) => promises.push(this.processLine(line,index)));
    await Promise.all(promises);
    console.log('promises ',promises);

    //console.log('data os ', this.data[0]);
    this.pageService.createPage2(filename);
  }

}

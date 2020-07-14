import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import * as fs from 'fs';
import * as numeral from 'numeral';
import { TractateRepository } from 'src/pages/tractate.repository';

@Console()
@Injectable()
export class ImportService {
  readonly tractateMetadata = /\{מסכת (.*)\,(.*)\}/;
  readonly metadata = /^(\d{12}) (\d{2})@ (.*)/;
  readonly structureRegex = /^(\d{2})(\d{4})(\d{3})(\d{3})/;
  readonly pageRegex = /\|([א-ת]),([א-ת])\|/;
  currentTractate = null;


  private data: string[];
  constructor(
    private pageService: PagesService,
    private tractateRepo: TractateRepository
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
  matchRegex(line:string) {
    let metaData;

    metaData = line.match(this.metadata);
    if (metaData) {
      const matchStructure = metaData[1].match(this.structureRegex);
      const [, line_no, piska, mishna, chapter] = matchStructure;
      let text = metaData[3];
      return {
        type: 'line',
        meta: {
          line_no,
          piska,
          mishna,
          chapter
        },
        text
      }
    }
    metaData = line.match(this.tractateMetadata);
    if (metaData) {
      const [, title_heb, title_eng] = metaData;
      return {
        type: 'tractate',
        title_heb,
        title_eng: title_eng.toLowerCase()
      }

    }

    return null;
  }
  async processLine(line: string,index: number) {
  //  if (index===0) {return;}
    console.log('processing ',index, '>\n');
    // read metadata
    const metaData = this.matchRegex(line);
   // console.log('meta ', metaData);
    if (metaData?.type === 'tractate') {
      this.currentTractate = {
          title_heb: metaData.title_heb,
          title_eng: metaData.title_eng
      }
      return;
    }
    // fix problem with hebrew rtl
    if (metaData?.type !== 'line') {return}

    const {  mishna, chapter } = metaData.meta;
    let { line_no, piska } = metaData.meta;
    let text = metaData.text;
    const pageMatch = text.match(this.pageRegex);
    if (pageMatch) {
      const [, daf,amud] = pageMatch;
      console.log(`PAGE daf: ${daf} amud:${amud}, `);
      text = text.replace(pageMatch[0],'');
    }
    console.log(`chapter ${chapter}, mishna: ${mishna}, line: ${piska}_${line_no}:`, this.reverseString(text));

    if (parseInt(piska) > 1000) {
      piska = numeral(parseInt(piska) - 1000).format('0000');
    }

    await this.pageService.setLine(
      this.currentTractate,
      chapter,
      mishna,
      {
        line: `${piska}_${line_no}`,
        text
      });
    await this.tractateRepo.upsert(this.currentTractate.title_eng, {title_heb: this.currentTractate.title_heb});   
      
  }

  @Command({
    command: 'import <filename>',
    description: 'Import tractate'
  })
  async import(filename:string){
    console.log('import ',filename);
    this.readFile(filename);

    for (let i=0;i<this.data.length;i++) {
      await this.processLine(this.data[i],i);
    }
    

    this.pageService.createPage2(filename);
  }

}

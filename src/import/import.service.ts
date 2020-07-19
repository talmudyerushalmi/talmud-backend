import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { PagesService } from '../pages/pages.service';
import * as fs from 'fs';
import * as numeral from 'numeral';
import { TractateRepository } from 'src/pages/tractate.repository';
import { Mishna } from 'src/pages/schemas/mishna.schema';
import { Tractate } from 'src/pages/schemas/tractate.schema';
import { LineMarkDto } from 'src/pages/dto/line-mark.dto';
import { MishnaRepository } from 'src/pages/misha.repository';

@Console()
@Injectable()
export class ImportService {
  readonly tractateMetadata = /\{מסכת (.*)\,(.*)\}/;
  readonly metadata = /^(\d{12}) (\d{2})@ (.*)/;
  readonly structureRegex = /^(\d{2})(\d{4})(\d{3})(\d{3})/;
  readonly pageRegex = /\|([א-ת]),([א-ת])\|/;
  currentTractate = null;
  tractateOrder = 0;
  lineOrder = 1;
  currentTractateDoc: Tractate;
  currentChapterIndex = 0;
  currentMishnaIndex = 0;
  currentLineIndex = 0;
  lineMark: LineMarkDto;
  linesBuffer: any[] = [];


  private data: string[];
  constructor(
    private pageService: PagesService,
    private tractateRepo: TractateRepository,
    private mishnaRepo: MishnaRepository
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
  async processSubLine(subline:string, index: number) {

    const lineRegex = /^\/\/\/(.*)/;
    let sublineText = subline;

    const metadata = subline.match(lineRegex);
    if (metadata) {

      try {
      // save buffer
      await this.pageService.updateMishnaLine(this.lineMark.tractate, this.lineMark.line, {
        sublines: this.linesBuffer
      }) }
      catch(e) {
        console.log('ERROR ',e);
      }
      console.log('save buffer ', this.lineMark.line);
      this.linesBuffer = []
      // new line
      sublineText = metadata[1];
      console.log('NEW LINE ');
     // this.lineMark = await this.tractateRepo.getNextLine(this.lineMark);
      this.lineMark = await this.mishnaRepo.getNextLine(this.lineMark);
      console.log('line mark', this.lineMark);

    }

    this.linesBuffer.push({text:sublineText});
    

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
      this.tractateOrder++;
      this.lineOrder = 1;
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

  

    await this.pageService.setLine(
      this.currentTractate,
      chapter,
      mishna,
      {
        originalLineNumber: `${piska}_${line_no}`,
        line: numeral(this.lineOrder++).format('00000'),
        text
      });
    await this.tractateRepo.upsert(this.currentTractate.title_eng,
       {title_heb: this.currentTractate.title_heb,
        order: this.tractateOrder
      }
       );   
      
  }

  @Command({
    command: 'import:tractates <filename>',
    description: 'Import tractate'
  })
  async importTractates(filename:string){
    this.readFile(filename);

    for (let i=0;i<this.data.length;i++) {
      await this.processLine(this.data[i],i);
    }
    

    this.pageService.createPage2(filename);
  }

  @Command({
    command: 'import:sublines <filename>',
    description: 'Import sublines'
  })
  async import(filename:string){
    this.readFile(filename);
    this.lineMark = {
      tractate: 'yevamot',
      chapter: '001',
      mishna: '001',
      line: '00000'
    }
    this.currentTractateDoc  = await this.tractateRepo.get('yevamot', true);
  


    for (let i=0;i<this.data.length;i++) {
      await this.processSubLine(this.data[i],i);
    }
    console.log(this.currentTractateDoc);
    

  }

}

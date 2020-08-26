import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tractate, Chapter } from './schemas/tractate.schema';
import { UpdatePageDto } from './dto/update-page.dto';
import { SetLineDto } from './dto/set-line.dto';
import { Mishna } from './schemas/mishna.schema';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './misha.repository';
import { UpdateMishnaLineDto } from './dto/save-mishna-line.dto';
import { tractateSettings } from './inc/tractates.settings';
import { synopsisList } from './inc/tractates.synopsis';
import * as numeral from 'numeral';
import { MishnaLink } from './models/mishna.link.model';

export interface iTractate {
  title_eng: string;
  title_heb: string;
}
@Injectable()
export class PagesService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>
  )
 {  }

  async getMishna(tractate: string, chapter:string, mishna: string):Promise<Mishna> {
    return this.mishnaRepository.find(tractate, chapter, mishna);
  }
  async getChapter(tractate: string, chapter:string):Promise<any> {
    return {
      tractate,
      chapter
    }
  }

  async getTractate(tractate: string,):Promise<Tractate> {
    return this.tractateRepository.get(tractate);
  }

  getTractateSettings(tractate: string): any {
   return {
     ...tractateSettings[tractate],
     synopsisList
    };
  }

  
  getChapterId(tractate: string, chapter: string, mishna:string):string {
    return `${tractate}_${chapter}_${mishna}`;
  }
  async upsertMishna(
    tractate: string,
    chapter: string,
    mishna: string,
    createMishnaDto:CreateMishnaDto): Promise<Mishna> {

    const id = this.mishnaRepository.getID(
      tractate,
      chapter,
      mishna)

    const mishnaDocument = await this.mishnaModel.findOneAndUpdate({id}, {
      id,
      tractate,
      chapter,
      mishna,
      ...createMishnaDto
    }, {
      upsert:true,
      new:true,
      setDefaultsOnInsert:true
    });
    return mishnaDocument;
  }

  
  async updateMishnaInTractate(mishnaDocument: Mishna): Promise<void> {
    // get tractate
    const tractateDocument = await this.tractateRepository.upsert(mishnaDocument.tractate);
    this.tractateRepository.addMishnaToChapter(tractateDocument, mishnaDocument);
    await tractateDocument.save();
  }

  async updatePage(updatePageDto: UpdatePageDto){
    return {
      updatePageDto
    }

  }


  async setLine(
    tractate: iTractate,
    chapter:string,
    mishna:string,
    setLineDto: SetLineDto ): Promise<void> {

    const mishnaDocument = await this.upsertMishna(tractate.title_eng,
      chapter,mishna,{});
    const found = mishnaDocument.lines.findIndex(line => line.lineNumber === setLineDto.line);
    if (found!==-1) {
     // console.log('found ', found);
      mishnaDocument.lines[found] = {
        lineNumber:setLineDto.line,
        mainLine: setLineDto.text
      }
    }
     else {
       mishnaDocument.lines.push({
        lineNumber: setLineDto.line,
        originalLineNumber: setLineDto.originalLineNumber,
        mainLine: setLineDto.text
      });
      mishnaDocument.lines = _.orderBy(mishnaDocument.lines,
        ['lineNumber'],['asc']);
    }
     mishnaDocument.previous = {
      tractate: tractate.title_eng, 
      chapter,
      mishna
     }
     mishnaDocument.next = {
      tractate: tractate.title_eng, 
      chapter,
      mishna
     }
     await mishnaDocument.save();

     // now update reference in tractate
     await this.updateMishnaInTractate(mishnaDocument);
  }

  async updateMishnaLine(
    tractate: string,
    line:string,
    updateMishnaLine: UpdateMishnaLineDto
  ): Promise<any>{
    const mishnaDoc = await this.mishnaModel.findOne({
      tractate,
      "lines.lineNumber": line,
    });
    const lineIndex = mishnaDoc.lines.findIndex(lineItem=>lineItem.lineNumber === line);
    mishnaDoc.lines[lineIndex].sublines = updateMishnaLine.sublines;
    mishnaDoc.markModified('lines')
    return mishnaDoc.save();

  }


  async getPreviousMishna(tractate: string, chapter:string, mishna: string):Promise<MishnaLink> {
    if (mishna==='001' && chapter === '001') {
      return null;
    }
    if (mishna!=='001') {
      return {
        tractate,
        chapter,
        mishna: numeral(parseInt(mishna)-1).format('000')
      }
    }
    // if need to go back one chapter
    const tractateDoc = await this.tractateRepository.get(tractate);
    const previousChapter = tractateDoc.chapters.find(
      c=>(c.id === (numeral(parseInt(chapter)-1)).format('000')))
    const lastMishnaInPreviousChapter = 
     previousChapter.mishnaiot[previousChapter.mishnaiot.length-1];


    return {
      tractate,
      chapter: previousChapter.id,
      mishna: lastMishnaInPreviousChapter.mishna,
    }
  }




  async getNextMishna(tractate: string, chapter:string, mishna: string):Promise<MishnaLink> {
    let nextChapter = chapter;
    // increment mishna
    let nextMishna = numeral(parseInt(mishna)+1).format('000');
    let nextMishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      nextMishna
    );
    if (!nextMishnaDoc) {
        // increment a chapter
    nextChapter = numeral(parseInt(chapter)+1).format('000');
    nextMishna = '001';
    nextMishnaDoc = await this.mishnaRepository.find(
      tractate,
      nextChapter,
      nextMishna
    );
     
    }

  
    if (nextMishnaDoc) {
      return {
        tractate,
        chapter: nextChapter,
        mishna:nextMishna
      }
    }
    return null;

  }
}

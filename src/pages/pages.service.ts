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
    // const page:PageEntity = await this.pageRepository.findOne({ where: { id:page_id } })
    // if (!page) {
    //   throw new NotFoundException("Page not found");
    // }
    // return page;

  }
  async getChapter(tractate: string, chapter:string):Promise<any> {
    // const page:PageEntity = await this.pageRepository.findOne({ where: { id:page_id } })
    // if (!page) {
    //   throw new NotFoundException("Page not found");
    // }
    // return page;
    return {
      tractate,
      chapter
    }
  }
  async getTractate(tractate: string,):Promise<Tractate> {
    return this.tractateRepository.get(tractate);
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

  
  async updateMishnaInTractate(mishnaDocument: Mishna) {
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

  async createPage2(test: string){
    console.log('creatng page2 ', test);
  }


  async setLine(
    tractate: iTractate,
    chapter:string,
    mishna:string,
    setLineDto: SetLineDto ) {

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
     await mishnaDocument.save();

     // now update reference in tractate
     await this.updateMishnaInTractate(mishnaDocument);

     return "saved";
  }



}

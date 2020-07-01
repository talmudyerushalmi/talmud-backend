import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { UpdatePageDto } from './dto/update-page.dto';
import { SetLineDto } from './dto/set-line.dto';
import { Mishna } from './schemas/mishna.schema';
import { CreateMishnaDto } from './dto/create-mishna.dto';

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>
  )
 {  }

  async getPage(tractate: string, chapter:string, page_id: string):Promise<any> {
    // const page:PageEntity = await this.pageRepository.findOne({ where: { id:page_id } })
    // if (!page) {
    //   throw new NotFoundException("Page not found");
    // }
    // return page;
    return {
      tractate,
      chapter,
      page_id
    }
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
  async getTractate(tractate: string,):Promise<any> {
    // const page:PageEntity = await this.pageRepository.findOne({ where: { id:page_id } })
    // if (!page) {
    //   throw new NotFoundException("Page not found");
    // }
    // return page;
    return {
      tractate,
    }
  }


  async updatePageInTractate(tractate: string, chapter_id:string, pageRef:Mishna) {
    console.log('updating in tractate');
    // if reference exists - return
    const tractateReference = await this.tractateModel.findOne({
      id: tractate}
    );
    console.log('found ', tractateReference);
    if (!tractateReference) {
      return;
    }
    const chapter = tractateReference.chapters.find(chapter=>chapter.id===chapter_id);
    const page = chapter.pages.find(page=>page.id === pageRef.id);
    if (!page) {
      chapter.pages.push(
        {
          id: pageRef.id,
          pagesRef: pageRef._id
        }
      );
      await this.tractateModel.updateOne({id:tractate},{
        chapters: tractateReference.chapters
      });
    }
  }
  // async test() {
  //
  // }

  getMishnaId(tractate: string, chapter: string, mishna:string) {
    return `${tractate}_${chapter}_${mishna}`;
  }
  async createMishna(
    tractate: string,
    chapter: string,
    mishna: string,
    createMishnaDto:CreateMishnaDto): Promise<any> {

    // if doesnt exist - create page
    const { lines } = createMishnaDto;


    const id = this.getMishnaId(
      tractate,
      chapter,
      mishna)

    const mishnaDocument = await this.mishnaModel.findOneAndUpdate({id}, {
      id,
      ...createMishnaDto
    }, {
      upsert:true,
      new:true,
      setDefaultsOnInsert:true
    });


    // await this.updatePageInTractate(tractate,chapter,pageDocument);
    // return {
    //   tractate,
    //   chapter,
    //   page,
    //   pageDocument
    // }
  }

  async updatePage(updatePageDto: UpdatePageDto){
    return {
      updatePageDto
    }

  }

  async createPage2(test: string){
    console.log('creatng page2 ', test);
  }

  async setMainLine(setLineDto: SetLineDto ) {

    console.log('setting line ', setLineDto);
    const id = `${setLineDto.chapter}_${setLineDto.mishna}`;
    const mishnaDocument = await this.mishnaModel.findOne({
      id: setLineDto.mishna
    });
    console.log('mishna ',mishnaDocument )


    return "inserted";

    // const pageDocument = await this.pageModel.findOneAndUpdate({id:page}, {
    //   id:page,
    //   lines
    // }, {
    //   upsert:true,
    //   new:true,
    //   setDefaultsOnInsert:true
    // });
  }



}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Page } from './schemas/page.schema';
import { Model, Types } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { UpdatePageDto } from './dto/update-page.dto';
import { Command, Console } from 'nestjs-console';

@Console()
@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Page.name) private pageModel: Model<Page>
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

  async updatePageInTractate(tractate: string, chapter_id:string, pageRef:Page) {
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
  async createPage(
    tractate,
    chapter,
    page,
    createPageDto:CreatePageDto): Promise<any> {

    // if doesnt exist - create page
    const { lines } = createPageDto;



    const pageDocument = await this.pageModel.findOneAndUpdate({id:page}, {
      id:page,
      lines
    }, {
      upsert:true,
      new:true,
      setDefaultsOnInsert:true
    });


    await this.updatePageInTractate(tractate,chapter,pageDocument);
    return {
      tractate,
      chapter,
      page,
      pageDocument
    }
  }

  async updatePage(updatePageDto: UpdatePageDto){
    return {
      updatePageDto
    }

  }

  async createPage2(test: string){
    console.log('creatng page2 ', test);
  }

  @Command({
    command: 'do <action>',
    description: 'Do anything'
  })
  async doCli(dowhat: string) {
    console.log('do cli ',dowhat);

  }
  // async getChapter() {
  //
  // }

}

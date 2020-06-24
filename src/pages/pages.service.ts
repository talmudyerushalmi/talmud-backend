import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Page as PageEntity } from './page.entity';
import { Repository } from 'typeorm';
import { Chapter } from './chapter.entity';
@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(PageEntity) private pageRepository: Repository<PageEntity>,
    @InjectRepository(Chapter) private chapterRepository: Repository<Chapter>
  )
 {  }

  async getPage(id: string):Promise<PageEntity> {
    const page:PageEntity = await this.pageRepository.findOne({ where: { id } })
    if (!page) {
      throw new NotFoundException("Page not found");
    }
    return page;
  }

  async createPage(createPageDto:CreatePageDto): Promise<PageEntity> {
    const {id, lines} = createPageDto;
    const page = this.pageRepository.create({
      id,
      lines,
    });

    await this.pageRepository.save(page);
    const chapter = this.chapterRepository.create({
      id:'tet',
      pages: [page],
      page_ids: [page._id]
    });
    await this.chapterRepository.save(chapter);
    return page;
  }

  // async getChapter() {
  //
  // }

}

import { Injectable } from '@nestjs/common';
import { Page, Pages } from './page.model';
import { CreatePageDto } from './dto/create-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Page as PageEntity } from './page.entity';
import { Repository } from 'typeorm';
@Injectable()
export class PagesService {
  private pages: Pages = {1:{id:'33', title:'df'}};
  constructor(
    @InjectRepository(PageEntity) private pageRepository: Repository<PageEntity>) {
  }

  getPage(page: string):Page {
    return this.pages[page];
  }

  async createPage(createPageDto:CreatePageDto): Promise<Page> {
    const {id, title} = createPageDto;
    const pageold: Page = {
      id,
      title
    };
    this.pages[pageold.id]= pageold;
    const page = this.pageRepository.create({
      id,
      title
    });
    return this.pageRepository.save(page);
  }

}

import { Injectable } from '@nestjs/common';
import { Page, Pages } from './page.model';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class PagesService {
  private pages: Pages = {1:{id:'33', title:'df'}}

  getPage(page: string):Page {
    return this.pages[page];
  }

  createPage(createPageDto:CreatePageDto) {
    const {id, title} = createPageDto;
    const page: Page = {
      id,
      title
    };
    this.pages[page.id]= page;
  }

}

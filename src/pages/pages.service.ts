import { Injectable } from '@nestjs/common';
import { Page } from './page.model';
import { CreatePageDto } from './dto/create-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Page as PageEntity } from './page.entity';
import { Repository } from 'typeorm';
@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(PageEntity) private pageRepository: Repository<PageEntity>) {
  }

  getPage(page: string):any {
    return 'test';
  }

  async createPage(createPageDto:CreatePageDto): Promise<Page> {
    const {id, lines} = createPageDto;
    const page = this.pageRepository.create({
      id,
      lines
    });
    return this.pageRepository.save(page);
  }

}

import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';

@Controller('page')
export class PagesController {
  constructor(private pagesService: PagesService) {

  }

  @Get('/:tractate/:chapter/:page')
  getPage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('page') page: string
  ) {
    return this.pagesService.getPage(tractate,chapter,page);
  }
  @Get('/:tractate/:chapter')
  getChapter(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,

  ) {
    return this.pagesService.getChapter(tractate, chapter);
  }
  @Get('/:tractate')
  getTractate(@Param('tractate') tractate: string) {
    return this.pagesService.getTractate(tractate);
  }

  @Post()
  @UsePipes(ValidationPipe)
  createPage(@Body() createPageDto: CreatePageDto) {
    console.log(createPageDto);
    return this.pagesService.createPage(createPageDto);
  }




}

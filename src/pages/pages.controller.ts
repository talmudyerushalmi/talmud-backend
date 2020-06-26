import { Body, Controller, Get, Param, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
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

  @Post('/:tractate/:chapter/:page')
  @UsePipes(ValidationPipe)
  createPage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('page') page: string,
    @Body() createPageDto: CreatePageDto) {
    console.log(createPageDto);
    return this.pagesService.createPage(tractate, chapter, page,createPageDto);
  }

  @Put('/:tractate/:chapter/:page')
  updatePage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('page') page: string,
    @Body() createPageDto: CreatePageDto) {
    return this.pagesService.updatePage(createPageDto);
  }



}

import { Body, Controller, Get, Param, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Controller('page')
export class PagesController {
  constructor(private pagesService: PagesService) {

  }

  @Get('/:tractate/:chapter/:mishna')
  getPage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string
  ) {
    return this.pagesService.getPage(tractate,chapter,mishna);
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

  @Post('/:tractate/:chapter/:mishna')
  @UsePipes(ValidationPipe)
  createPage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Body() createMishnaDto: CreateMishnaDto) {

    console.log(createMishnaDto);
    return this.pagesService.createMishna(tractate, chapter, mishna,createMishnaDto);
  }

  @Put('/:tractate/:chapter/:mishna')
  updatePage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('page') page: string,
    @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.updatePage(updatePageDto);
  }



}

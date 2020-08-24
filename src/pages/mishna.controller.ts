/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { UpdateMishnaLineDto } from './dto/save-mishna-line.dto';

@Controller('mishna')
export class MishnaController {
  constructor(private pagesService: PagesService) {}

  @Get('/:tractate/:chapter/:mishna')
  getMishna(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
  ) {
    return this.pagesService.getMishna(tractate, chapter, mishna);
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
    @Body() createMishnaDto: CreateMishnaDto,
  ) {
    console.log(createMishnaDto);
    return this.pagesService.upsertMishna(
      tractate,
      chapter,
      mishna,
      createMishnaDto,
    );
  }

  @Put('/:tractate/:chapter/:mishna')
  updatePage(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('page') page: string,
    @Body() updatePageDto: UpdatePageDto,
  ) {
    return this.pagesService.updatePage(updatePageDto);
  }

  @Put('/:tractate/:chapter/:mishna/:line')
  @UsePipes(ValidationPipe)
  async updateLine(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateMishnaLineDto: UpdateMishnaLineDto,
  ) {
    return this.pagesService.updateMishnaLine(
      tractate,
      line,
      updateMishnaLineDto,
    );
  }
}

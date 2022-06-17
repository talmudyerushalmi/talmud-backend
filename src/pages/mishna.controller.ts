/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import { UpdateMishnaLineDto } from './dto/save-mishna-line.dto';
import { Response } from 'express';
import { GetChapterDTO } from './dto/get-chapter.dto';


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

  @Get('/:tractate/:chapter/:mishna/tei')
  @Header("Content-type","text/xml")
  getMishnaTEI(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Res({ passthrough: true }) res: Response
  ) {
    res.setHeader("Content-Disposition",`attachment; filename="tei_${tractate}_${chapter}_${mishna}.xml"`)
    return this.pagesService.getMishnaTEI(tractate, chapter, mishna);
  }

  @Get('/:tractate/:chapter')
  getChapter(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Query() query: GetChapterDTO
  ) {
    return this.pagesService.getChapter(tractate, chapter, query.mishna);
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
    return this.pagesService.upsertMishna(
      tractate,
      chapter,
      mishna,
      createMishnaDto,
    );
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

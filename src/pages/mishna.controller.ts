/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  Response,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreateMishnaDto } from './dto/create-mishna.dto';
import { UpdateMishnaLineDto } from './dto/save-mishna-line.dto';
import { GetChapterDTO } from './dto/get-chapter.dto';
import { tractateSettings } from './inc/tractates.settings';
import { UserGroup, UserType } from '../middleware/userType';
import { Response as ResponseFromExpress } from 'express';

@Controller('mishna')
export class MishnaController {
  constructor(private pagesService: PagesService) {}

  private throwIfForbidden(tractate: string, userGroup: UserGroup) {
    const canView = tractateSettings[tractate]?.public || userGroup === UserGroup.Editor;
    if (!canView) {
     throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  @Get('/:tractate/:chapter/:mishna')
  async getMishna(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Response() res,
  ) {
    this.throwIfForbidden(tractate, res.locals.userGroup);
    const mishnaDoc = await this.pagesService.getMishna(
      tractate,
      chapter,
      mishna,
    );
    res.json(mishnaDoc);
  }

  @Get('/:tractate/:chapter/:mishna/tei')
  @Header('Content-type', 'text/xml')
  getMishnaTEI(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Res({ passthrough: true }) res: ResponseFromExpress,
  ) {
     res.setHeader("Content-Disposition",`attachment; filename="tei_${tractate}_${chapter}_${mishna}.xml"`)
    return this.pagesService.getMishnaTEI(tractate, chapter, mishna);
  }

  @Get('/:tractate/:chapter')
  async getChapter(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Query() query: GetChapterDTO,
    @Response() res,
  ) {
    this.throwIfForbidden(tractate, res.locals.userGroup);
    const chapterDoc = await this.pagesService.getChapter(tractate, chapter, query.mishna);
    return res.json(chapterDoc);
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

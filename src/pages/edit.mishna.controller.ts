/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateLineDto } from './dto/update-line.dto';
import { UpdateMishnaRichTextsDto } from './dto/update-mishna-texts.dto';
import { UpdateNosachDto } from './dto/update-nosach.dto';
import { UpdateParallelsDto } from './dto/update-parallels.dto';
import { PagesService } from './pages.service';
import { SublineService } from './subline.service';

@Controller('edit/mishna')
export class EditMishnaController {
  constructor(
    private pagesService: PagesService,
    private sublineService: SublineService,
  ) {}

  @Get('/:tractate/:chapter/:mishna')
  async getMishna(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
  ) {
    const mishnaDoc = await this.pagesService.getMishna(
      tractate,
      chapter,
      mishna,
    );
    const tractateSettings = this.pagesService.getTractateSettings(tractate);

    return {
      mishnaDoc,
      tractateSettings,
    };
  }

  @Post('/:tractate/:chapter/:mishna')
  @UsePipes(ValidationPipe)
  async updateMishna(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Body() updateMishnaDto: UpdateMishnaRichTextsDto,
  ) {
    const id = `${tractate}_${chapter}_${mishna}`
    return this.pagesService.saveMishna(
      id,
      updateMishnaDto,
    );
  }

  @Post('/:tractate/:chapter/:mishna/:line')
  @UsePipes(ValidationPipe)
  async updateLine(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateLineDto: UpdateLineDto,
  ) {
    return this.sublineService.updateSubline(
      tractate,
      chapter,
      mishna,
      line,
      updateLineDto,
    );
  }

  @Post('/:tractate/:chapter/:mishna/:line/nosach')
  @UsePipes(ValidationPipe)
  async updateNosach(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateLineDto: UpdateNosachDto,
  ) {
    return this.sublineService.updateSublines(
      tractate,
      chapter,
      mishna,
      line,
      updateLineDto,
    );
  }

  @Post('/:tractate/:chapter/:mishna/:line/parallels')
  @UsePipes(ValidationPipe)
  async updateParallels(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateParallelsDto: UpdateParallelsDto,
  ) {
    return this.sublineService.updateLineParallels(
      tractate,
      chapter,
      mishna,
      line,
      updateParallelsDto.parallels,
    );
  }

  @Delete('/:tractate/:chapter/:mishna/:line/:subline')
  @UsePipes(ValidationPipe)
  async deleteSubline(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Param('subline', ParseIntPipe) subline: number,
  ) {
    return this.sublineService.deleteSubline(
      tractate,
      chapter,
      mishna,
      line,
      subline,
    );
  }
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateLineDto } from './dto/update-line.dto';
import { UpdateMishnaRichTextsDto } from './dto/update-mishna-texts.dto';
import { UpdateNosachDto } from './dto/update-nosach.dto';
import { ParallelLinkDto } from './dto/update-parallels.dto';
import { PagesService } from './pages.service';
import { SublineService } from './subline.service';
import { ParallelService } from './parallel.service';

@Controller('edit/mishna')
export class EditMishnaController {
  constructor(
    private pagesService: PagesService,
    private sublineService: SublineService,
    private parallelService: ParallelService,
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
  async updateSublineContent(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateLineDto: UpdateLineDto,
  ) {
    return this.sublineService.updateSublineContent(
      tractate,
      chapter,
      mishna,
      line,
      updateLineDto,
    );
  }

  @Post('/:tractate/:chapter/:mishna/:line/nosach')
  @UsePipes(ValidationPipe)
  async splitSublineText(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() updateLineDto: UpdateNosachDto,
  ) {
    return this.sublineService.splitSublineText(
      tractate,
      chapter,
      mishna,
      line,
      updateLineDto,
    );
  }

  // OLD ENDPOINT REMOVED - Use granular operations instead:
  // POST /:tractate/:chapter/:mishna/:line/parallel/add
  // DELETE /:tractate/:chapter/:mishna/:line/parallel  
  // PUT /:tractate/:chapter/:mishna/:line/parallel

  // NEW GRANULAR PARALLEL OPERATIONS

  @Post('/:tractate/:chapter/:mishna/:line/parallel/add')
  @UsePipes(ValidationPipe)
  async addParallel(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() parallel: ParallelLinkDto,
  ) {
    return this.parallelService.addParallel(tractate, chapter, mishna, line, parallel);
  }

  @Delete('/:tractate/:chapter/:mishna/:line/parallel')
  @UsePipes(ValidationPipe)
  async deleteParallel(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() parallel: ParallelLinkDto,
  ) {
    return this.parallelService.deleteParallel(tractate, chapter, mishna, line, parallel);
  }

  @Put('/:tractate/:chapter/:mishna/:line/parallel')
  @UsePipes(ValidationPipe)
  async updateParallel(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('line') line: string,
    @Body() newParallel: ParallelLinkDto,
  ) {
    return this.parallelService.updateParallel(
      tractate, 
      chapter, 
      mishna, 
      line, 
      newParallel
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

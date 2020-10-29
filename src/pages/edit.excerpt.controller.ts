/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Controller,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  Body, Delete
} from '@nestjs/common';
import { SaveMishnaExcerptDto } from './dto/save-mishna-excerpt.dto';
import { MishnaRepository } from './mishna.repository';

@Controller('edit/excerpt')
export class EditMishnaExcerptController {
  constructor(private mishnaRepository: MishnaRepository) {}

  @Post('/:tractate/:chapter/:mishna')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )
  async saveExcerpt(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Body() saveMishnaExcerpt: SaveMishnaExcerptDto,
  ) {
    return this.mishnaRepository.saveExcerpt(
      tractate,
      chapter,
      mishna,
      saveMishnaExcerpt,
    );
  }
  @Delete('/:tractate/:chapter/:mishna/:excerpt')
  async deleteExcerpt(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('excerpt') excerptKey: string,

  ) {
    return this.mishnaRepository.deleteExcerpt(tractate, chapter, mishna, parseInt(excerptKey));
  }
}
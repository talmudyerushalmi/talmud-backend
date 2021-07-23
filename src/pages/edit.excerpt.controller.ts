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
    const r = await this.mishnaRepository.saveExcerpt(
      tractate,
      chapter,
      mishna,
      saveMishnaExcerpt,
    );
     // todo - solve properly
     return {...r._doc}
  }
  @Delete('/:tractate/:chapter/:mishna/:excerpt')
  async deleteExcerpt(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('excerpt') excerptKey: string,

  ) {
    // todo - solve properly
    const r = await this.mishnaRepository.deleteExcerpt(tractate, chapter, mishna, parseInt(excerptKey));
    return {...r._doc}

  }
}

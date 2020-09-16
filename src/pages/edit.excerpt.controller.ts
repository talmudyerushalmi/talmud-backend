/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
    Controller,
    Get,
    Param,
    Post,
    UsePipes,
    ValidationPipe,
    Body,
  } from '@nestjs/common';
  import { PagesService } from './pages.service';
  import { SaveMishnaExcerptDto } from './dto/save-mishna-excerpt.dto';

  @Controller('edit/excerpt')
  export class EditMishnaExcerptController {
    constructor(private pagesService: PagesService) {}
  
    @Post('/:tractate/:chapter/:mishna')
    @UsePipes(ValidationPipe)
    async saveExcerpt(
      @Param('tractate') tractate: string,
      @Param('chapter') chapter: string,
      @Param('mishna') mishna: string,
      @Body() saveMishnaExcerpt: SaveMishnaExcerptDto
    ) {

        

      return {
        test: 'hi'
      }
    }

  }
  
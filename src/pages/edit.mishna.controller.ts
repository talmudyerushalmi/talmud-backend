/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
    Controller,
    Get,
    Param,
  } from '@nestjs/common';
  import { PagesService } from './pages.service';

  @Controller('edit/mishna')
  export class EditMishnaController {
    constructor(private pagesService: PagesService) {}
  
    @Get('/:tractate/:chapter/:mishna')
    async getMishna(
      @Param('tractate') tractate: string,
      @Param('chapter') chapter: string,
      @Param('mishna') mishna: string,
    ) {

        const mishnaDoc = await this.pagesService.getMishna(tractate, chapter, mishna);
        const tractateSettings = this.pagesService.getTractateSettings(tractate);
        const allTractates = await this.pagesService.getAllTractates();

      return {
          mishnaDoc,
          tractateSettings,
          allTractates
      }
    }


  }
  
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Controller, Get, Param } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { RelatedService } from './related.service';

@Controller('related')
export class RelatedController {
  constructor(
    private relatedService: RelatedService,
    private mishnaRepository: MishnaRepository,
  ) {}


  @Get('/:tractate/:chapter')
  async getRelated(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    ) {
    return this.relatedService.getRelated(tractate, chapter);
  }


}

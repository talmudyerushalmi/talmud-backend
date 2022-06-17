/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Controller, Get, Param } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { NavigationService } from './navigation.service';

@Controller('navigation')
export class NavigationtController {
  constructor(
    private navigationService: NavigationService,
    private mishnaRepository: MishnaRepository,
  ) {}

  @Get()
  async getNavigation(): Promise<any> {
    const tractates = await this.navigationService.getAllTractates();
    return {
      tractates,
    };
  }


  @Get('/:tractate/:chapter/:mishna')
  async getMishnaForNavigation(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    ) {
    return this.navigationService.getMishnaForNavigation(tractate, chapter, mishna);
  }
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Controller, Get, Param } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { NavigationService } from './navigation.service';
import { DafAmudMappingRepository } from './daf-amud-mapping.repository';

@Controller('navigation')
export class NavigationtController {
  constructor(
    private navigationService: NavigationService,
    private mishnaRepository: MishnaRepository,
    private dafAmudMappingRepository: DafAmudMappingRepository,
  ) {}

  @Get()
  async getNavigation(): Promise<any> {
    const tractates = await this.navigationService.getAllTractates();
    return {
      tractates,
    };
  }

  @Get('daf-amud/:tractate/:daf/:amud')
  async getDafAmudMapping(
    @Param('tractate') tractate: string,
    @Param('daf') daf: string,
    @Param('amud') amud: string,
  ) {
    const mapping = await this.dafAmudMappingRepository.findByDafAmud(
      tractate,
      daf,
      amud,
    );
    if (!mapping) {
      return null;
    }
    return {
      chapter: mapping.chapter,
      halacha: mapping.halacha,
      system_line: mapping.system_line,
    };
  }

  @Get('dafs/:tractate')
  async getAllDafsForTractate(@Param('tractate') tractate: string) {
    const dafs = await this.dafAmudMappingRepository.getAllDafsForTractate(
      tractate,
    );
    return { dafs };
  }

  @Get('amudim/:tractate/:daf')
  async getAmudimsForDaf(
    @Param('tractate') tractate: string,
    @Param('daf') daf: string,
  ) {
    const amudim = await this.dafAmudMappingRepository.getAmudimsForDaf(
      tractate,
      daf,
    );
    return { amudim };
  }

  @Get(':tractate/:chapter/:mishna')
  async getMishnaForNavigation(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    ) {
    return this.navigationService.getMishnaForNavigation(tractate, chapter, mishna);
  }
}

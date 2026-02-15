/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Controller, Get, Param } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { TractateRepository } from './tractate.repository';

@Controller('navigation')
export class NavigationtController {
  constructor(
    private navigationService: NavigationService,
    private tractateRepository: TractateRepository,
  ) {}

  @Get()
  async getNavigation(): Promise<any> {
    const tractates = await this.navigationService.getAllTractates();
    return {
      tractates,
    };
  }

  /**
   * Unified navigation endpoint that handles both:
   * 1. Direct Chapter/Mishna navigation: /navigation/:tractate/:chapter/:mishna
   * 2. Daf/Amud navigation: /navigation/:tractate/:daf/:amud (automatically detects and converts)
   * 
   * The endpoint intelligently determines if the parameters are Daf/Amud or Chapter/Mishna
   * based on the Tractate's dafs array.
   */
  @Get(':tractate/:param1/:param2')
  async navigate(
    @Param('tractate') tractate: string,
    @Param('param1') param1: string,
    @Param('param2') param2: string,
  ) {
    // Check if this is Daf/Amud navigation by looking up in tractate
    const tractateDoc = await this.tractateRepository.get(tractate);
    
    if (tractateDoc?.dafs) {
      const dafEntry = tractateDoc.dafs.find(d => d.id === param1);
      if (dafEntry) {
        const amudEntry = dafEntry.amudim.find(a => a.amud === param2);
        if (amudEntry) {
          // This is Daf/Amud navigation - convert and navigate
          const result = await this.navigationService.getMishnaForNavigation(
            tractate,
            amudEntry.chapter,
            amudEntry.halacha,
          );
          
          return {
            ...result,
            system_line: amudEntry.system_line,
          };
        }
      }
    }
    
    // Default: treat as Chapter/Mishna navigation
    return this.navigationService.getMishnaForNavigation(tractate, param1, param2);
  }
}

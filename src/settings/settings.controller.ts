import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddCompositionDto } from './dto/add.compositionDto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('/synopsis/list')
  async getSynopsisList(): Promise<any> {
    return this.settingsService.getSynopsisList();
  }

  @Get('/:settingsID')
  async getSettings(@Param('settingsID') settingsID: string): Promise<any> {
    return this.settingsService.getSettings(settingsID);
  }

  @Post('/compositions/add')
  async addComposition(
    @Body() compositionToAdd: AddCompositionDto,
  ): Promise<any> {
    return this.settingsService.addComposition(compositionToAdd);
  }
}

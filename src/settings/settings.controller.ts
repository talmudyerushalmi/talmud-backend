import { Controller, Get, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('/:settingsID')
  async getMishna(@Param('settingsID') settingsID: string): Promise<any> {
    return this.settingsService.getSettings(settingsID);
  }
}

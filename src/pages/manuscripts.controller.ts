import { Controller, Get } from '@nestjs/common';
import { ManuscriptsService } from './manuscripts.service';
import { Manuscripts } from './schemas/manuscripts.schema';

@Controller('manuscripts')
export class ManuscriptsController {
  constructor(private manuscriptsService: ManuscriptsService) {}

  @Get()
  async getManuscripts(): Promise<Manuscripts[]> {
    return await this.manuscriptsService.getAllManuscripts();
  }
}

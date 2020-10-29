import { Controller, Get } from '@nestjs/common';
import { PagesService } from '../pages.service';

@Controller('tractates')
export class TractatesController {

    constructor(private pagesService: PagesService) {}

    @Get()
    async getAllTractates(): Promise<any> {
        const tractates = await this.pagesService.getAllTractates();
        return {
            tractates
        }
      }
}

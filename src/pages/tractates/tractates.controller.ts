import { Controller, Get, Query } from '@nestjs/common';
import { PagesService } from '../pages.service';

@Controller('tractates')
export class TractatesController {

    constructor(private pagesService: PagesService) {}

    /**
     * `?raw=true` returns the un-overlaid list — used by the admin nav bar so editors
     * can pick individual underlying halachas (ב, ג) when unifies are in play. View
     * callers omit it and get the merged display (ב-ג).
     */
    @Get()
    async getAllTractates(@Query('raw') raw?: string): Promise<any> {
        const tractates = await this.pagesService.getAllTractates({
          raw: raw === 'true',
        });
        return {
            tractates
        }
      }
}

import { Controller, Get, Param } from '@nestjs/common';
import { RabbiService } from './rabbi.service';
import { Rabbi } from './schemas/rabbi.schema';

@Controller('rabbies')
export class RabbiController {
  constructor(private readonly rabbiService: RabbiService) {}

  @Get()
  findAll(): Promise<Rabbi[]> {
    return this.rabbiService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Rabbi | null> {
    return this.rabbiService.findById(id);
  }
}

import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';

@Controller('pages')
export class PagesController {
  constructor(private pagesService: PagesService) {

  }

  @Get('/:id')
  getPage(@Param('id') id: string) {
    return this.pagesService.getPage(id);
  }

  @Post()
  @UsePipes(ValidationPipe)
  createPage(@Body() createPageDto: CreatePageDto) {
    console.log(createPageDto);
    return this.pagesService.createPage(createPageDto);
  }




}

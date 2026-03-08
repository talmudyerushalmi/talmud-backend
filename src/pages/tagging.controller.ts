import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { TaggingService } from './tagging.service';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';

@Controller('tagging')
export class TaggingController {
  constructor(private readonly taggingService: TaggingService) {}

  @Get(':tractate/:chapter/:mishna/sublines')
  getSublines(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
  ) {
    return this.taggingService.getSublines(tractate, chapter, mishna);
  }

  @Put(':tractate/:chapter/:mishna/sublines/:sublineIndex')
  updateSublineTags(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('sublineIndex', ParseIntPipe) sublineIndex: number,
    @Body() dto: UpdateSublineTagsDto,
  ) {
    return this.taggingService.updateSublineTags(tractate, chapter, mishna, sublineIndex, dto);
  }
}

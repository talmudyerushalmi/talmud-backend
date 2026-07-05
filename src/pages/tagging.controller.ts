import { Body, Controller, Get, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { TaggingService } from './tagging.service';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';

@Controller('tagging')
export class TaggingController {
  constructor(private readonly taggingService: TaggingService) {}

  /**
   * `?compose=true` opts into halacha-override processing (used by the view side so
   * tagging data lines up with the composed mishna). Admin callers omit it and get raw
   * source sublines. `?part=N` is consumed only when `compose=true` and the mishna is
   * a split.
   */
  @Get(':tractate/:chapter/:mishna/sublines')
  getSublines(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Query('compose') compose?: string,
    @Query('part') part?: string,
  ) {
    const parsedPart = part != null ? parseInt(part, 10) : undefined;
    return this.taggingService.getSublines(tractate, chapter, mishna, {
      compose: compose === 'true',
      part: Number.isFinite(parsedPart) ? parsedPart : undefined,
    });
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

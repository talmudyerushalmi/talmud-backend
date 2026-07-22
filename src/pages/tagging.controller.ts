import { Body, Controller, Get, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { TaggingService } from './tagging.service';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';
import {
  ApplyAiTagsDto,
  ResolveAiTagsDto,
  SaveAiInstructionsDto,
} from './dto/ai-tagging-apply.dto';

@Controller('tagging')
export class TaggingController {
  constructor(private readonly taggingService: TaggingService) {}

  /**
   * The single global AI instruction document. GET is open (read-only);
   * PUT is Editor-gated via the `tagging/*` PUT middleware. Declared before the
   * `:tractate/...` param routes so the static path matches unambiguously.
   */
  @Get('ai/instructions')
  getAiInstructions() {
    return this.taggingService.getAiInstructions();
  }

  @Put('ai/instructions')
  saveAiInstructions(@Body() dto: SaveAiInstructionsDto) {
    return this.taggingService.saveAiInstructions(dto.content);
  }

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

  /**
   * Applies a batch of AI suggestions (one sugya) as pending categories.
   * PUT so it's covered by `EditorMiddleware` (see `PagesModule.configure`).
   */
  @Put(':tractate/:chapter/:mishna/ai/apply')
  applyAiTags(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Body() dto: ApplyAiTagsDto,
  ) {
    return this.taggingService.applyAiTags(tractate, chapter, mishna, dto);
  }

  /** Approves/dismisses pending AI categories on a single subline. */
  @Put(':tractate/:chapter/:mishna/sublines/:sublineIndex/ai/resolve')
  resolveAiTags(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Param('mishna') mishna: string,
    @Param('sublineIndex', ParseIntPipe) sublineIndex: number,
    @Body() dto: ResolveAiTagsDto,
  ) {
    return this.taggingService.resolveAiTags(
      tractate,
      chapter,
      mishna,
      sublineIndex,
      dto,
    );
  }
}

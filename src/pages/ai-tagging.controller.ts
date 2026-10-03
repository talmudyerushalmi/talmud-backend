/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Response,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AiTaggingService } from './ai-tagging.service';
import { ExportSugyotDto } from './dto/ai-tagging-export.dto';

/**
 * Editor-only API backing the AI-tagging export admin page.
 * Auto-gated by `EditorMiddleware` via the `edit/*` route prefix
 * (see `PagesModule.configure`).
 */
@Controller('edit/ai-tagging')
export class AiTaggingController {
  constructor(private readonly aiTaggingService: AiTaggingService) {}

  /**
   * One row per NAMED sugya in the chapter, in halacha order — powers the
   * checkbox list the editor picks from.
   */
  @Get('chapter/:tractate/:chapter')
  listChapter(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
  ) {
    return this.aiTaggingService.listSugyotForChapter(tractate, chapter);
  }

  /**
   * Builds a ZIP containing one `.jsonl` per selected sugya and ships it with
   * an `attachment` Content-Disposition so browsers prompt a single download.
   * The whole archive lives in memory — payload is tiny (one chapter, at most
   * a few hundred small text files) and DEFLATE crushes the repeated JSON keys.
   */
  @Post('export')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async export(@Response() res, @Body() dto: ExportSugyotDto) {
    const { buffer } = await this.aiTaggingService.buildZipExport(
      dto.tractate,
      dto.chapter,
      dto.sugyot,
      dto.includeTags,
    );
    const filename = buildExportFilename(dto.tractate, dto.chapter);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}

/**
 * Produces a deterministic, filesystem-safe filename for the download.
 * Example: `ai-tagging_shevi_it_003_2026-07-06.zip`.
 */
function buildExportFilename(tractate: string, chapter: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ai-tagging_${safe(tractate)}_${safe(chapter)}_${date}.zip`;
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Response,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { HalachaOverrideService } from './halacha-override.service';
import { UpsertHalachaOverrideDto } from './dto/halacha-override.dto';

/**
 * Editor-only API for managing per-chapter Halacha overrides (split / unify).
 * Auto-gated by `EditorMiddleware` via the `edit/*` route prefix (see `PagesModule.configure`).
 */
@Controller('edit/halacha-overrides')
export class HalachaOverrideController {
  constructor(private readonly halachaOverrideService: HalachaOverrideService) {}

  /**
   * Returns the override doc (or `null`) PLUS the per-Halacha structural summary
   * the admin UI needs to render the chip strip and the split editor.
   */
  @Get('/:tractate/:chapter')
  async get(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
  ) {
    const [override, chapterStructure] = await Promise.all([
      this.halachaOverrideService.getOverride(tractate, chapter),
      this.halachaOverrideService.getChapterStructure(tractate, chapter),
    ]);
    return { override, chapterStructure };
  }

  /**
   * Replaces the override doc for this chapter with the supplied operations.
   * Use an empty `operations` array to keep an audit doc with no active overrides;
   * use DELETE to fully revert.
   */
  @Put('/:tractate/:chapter')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async upsert(
    @Response() res,
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
    @Body() dto: UpsertHalachaOverrideDto,
  ) {
    const saved = await this.halachaOverrideService.upsertOverride(
      tractate,
      chapter,
      dto,
      res.locals.user?.email,
    );
    return res.json(saved);
  }

  @Delete('/:tractate/:chapter')
  async remove(
    @Param('tractate') tractate: string,
    @Param('chapter') chapter: string,
  ) {
    return this.halachaOverrideService.deleteOverride(tractate, chapter);
  }
}

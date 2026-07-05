import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';
import { HalachaOverrideService } from './halacha-override.service';
import { Line } from './models/line.model';

@Injectable()
export class TaggingService {
  constructor(
    private mishnaRepository: MishnaRepository,
    private halachaOverrideService: HalachaOverrideService,
  ) {}

  /**
   * Returns the flat list of sublines that drive the tagged sidebar / connection lines.
   *
   * Two callers, two index spaces:
   *  - Admin tagging page (`/admin/tagging/...`) wants RAW source-document sublines with
   *    their ORIGINAL indices — that's the layer editors persist tags into. It calls
   *    without `compose`.
   *  - The view side (`MishnaPage` in tagged mode) needs sublines whose indices line up
   *    with the displayed mishna (which is itself override-aware). It passes `compose=true`
   *    and, for splits, the current `part`. We then route through the same compose
   *    pipeline `pages.service.getMishna` uses so the FE's join-by-index becomes correct.
   *
   * When `compose` is set but the mishna has no override, we transparently fall back to
   * raw — keeps the contract simple for the view-side caller.
   */
  async getSublines(
    tractate: string,
    chapter: string,
    mishna: string,
    opts: { compose?: boolean; part?: number } = {},
  ) {
    if (opts.compose) {
      const resolved = await this.halachaOverrideService.resolveMishna(
        tractate,
        chapter,
        mishna,
        { part: opts.part },
      );
      if (resolved) {
        return this.flattenSublines(resolved.mishna);
      }
      // No override → fall through to raw, matching the admin behavior.
    }

    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }
    return this.flattenSublines(mishnaDoc);
  }

  /**
   * Flattens a (possibly composed) Mishna into the `TaggingSubline[]` shape the FE
   * consumes. The composed payload's `subline.index` is already renumbered to match
   * the displayed view, so the FE's `taggingData.find(t => t.index === subline.index)`
   * join lines up.
   */
  private flattenSublines(mishna: { lines?: Line[] }) {
    return (mishna.lines ?? []).flatMap((line) =>
      (line.sublines ?? []).map((subline) => ({
        index: subline.index,
        text: subline.text,
        lineNumber: line.lineNumber,
        categories: subline.categories || [],
        rabbiMentions: subline.rabbiMentions || [],
        comments: subline.comments || [],
      })),
    );
  }

  async updateSublineTags(
    tractate: string,
    chapter: string,
    mishna: string,
    sublineIndex: number,
    dto: UpdateSublineTagsDto,
  ) {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }

    let found = false;
    for (const line of mishnaDoc.lines) {
      for (const subline of line.sublines || []) {
        if (subline.index === sublineIndex) {
          if (dto.categories !== undefined) subline.categories = dto.categories as any;
          if (dto.rabbiMentions !== undefined) subline.rabbiMentions = dto.rabbiMentions as any;
          if (dto.comments !== undefined) subline.comments = dto.comments as any;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new HttpException(`Subline ${sublineIndex} not found`, HttpStatus.NOT_FOUND);
    }

    mishnaDoc.markModified('lines');
    await mishnaDoc.save();
    return { success: true };
  }
}

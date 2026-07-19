import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';
import {
  ApplyAiTagsDto,
  ResolveAiTagsDto,
} from './dto/ai-tagging-apply.dto';
import { HalachaOverrideService } from './halacha-override.service';
import { Line, SubLine } from './models/line.model';

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
        // View side: pending AI suggestions are editor-only, so strip them.
        return this.flattenSublines(resolved.mishna, { hidePending: true });
      }
      // No override → fall through to raw, matching the admin behavior.
    }

    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }
    // Admin tagging screen (no compose): keep pending categories so the editor
    // can review/approve/dismiss them.
    return this.flattenSublines(mishnaDoc, { hidePending: opts.compose });
  }

  /**
   * Flattens a (possibly composed) Mishna into the `TaggingSubline[]` shape the FE
   * consumes. The composed payload's `subline.index` is already renumbered to match
   * the displayed view, so the FE's `taggingData.find(t => t.index === subline.index)`
   * join lines up.
   */
  private flattenSublines(
    mishna: { lines?: Line[] },
    opts: { hidePending?: boolean } = {},
  ) {
    // A sugya begins on the first subline that carries a non-empty sugiaName and
    // continues until the next named subline (mirrors `extractSugias`). We stamp
    // every subline with its owning sugya name so the FE can group the flat list
    // into sugya sections without a second round-trip.
    let currentSugiaName = '';
    return (mishna.lines ?? []).flatMap((line) =>
      (line.sublines ?? []).map((subline) => {
        if (subline.sugiaName && subline.sugiaName.trim() !== '') {
          currentSugiaName = subline.sugiaName.trim();
        }
        const categories = subline.categories || [];
        return {
          index: subline.index,
          text: subline.text,
          lineNumber: line.lineNumber,
          sugiaName: currentSugiaName,
          categories: opts.hidePending
            ? categories.filter((c) => c.status !== 'pending')
            : categories,
          rabbiMentions: subline.rabbiMentions || [],
          comments: subline.comments || [],
        };
      }),
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

  /**
   * Applies a batch of AI suggestions (typically one sugya's worth). For each
   * listed subline we snapshot the current categories into
   * `pendingOriginalCategories` and replace them with the AI categories marked
   * `status: 'pending'`. Re-applying over an already-pending subline keeps the
   * ORIGINAL (pre-AI) snapshot so a later dismiss still restores the true
   * originals rather than a previous pending batch.
   *
   * Sublines whose index doesn't exist in the mishna are silently skipped; the
   * FE already scopes the payload to the clicked sugya.
   */
  async applyAiTags(
    tractate: string,
    chapter: string,
    mishna: string,
    dto: ApplyAiTagsDto,
  ) {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }

    const byIndex = this.indexSublines(mishnaDoc.lines);
    let applied = 0;
    for (const entry of dto.sublines) {
      const subline = byIndex.get(entry.sublineIndex);
      if (!subline) continue;

      // Preserve the earliest (true) original across repeated uploads.
      const original =
        subline.pendingOriginalCategories ?? subline.categories ?? [];
      subline.pendingOriginalCategories = original;
      subline.categories = entry.categories.map((c) => ({
        categoryId: c.categoryId,
        connections: [],
        status: 'pending' as const,
        reason: c.reason,
      }));
      applied += 1;
    }

    mishnaDoc.markModified('lines');
    await mishnaDoc.save();
    return { success: true, applied, sublines: this.flattenSublines(mishnaDoc) };
  }

  /**
   * Resolves pending AI tags on a single subline:
   *  - `approveAll`   → drop the `pending` flag from every pending category.
   *  - `dismissAll`   → restore the pre-AI snapshot (undo the whole batch).
   *  - `approveCategory` → drop the flag from one category (by id).
   *  - `dismissCategory` → remove one pending category (by id).
   *
   * Per-category actions clear the snapshot once no pending categories remain,
   * since the batch is then fully resolved and can no longer be dismissed as a
   * whole. The approved categories keep their `reason`.
   */
  async resolveAiTags(
    tractate: string,
    chapter: string,
    mishna: string,
    sublineIndex: number,
    dto: ResolveAiTagsDto,
  ) {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }

    const subline = this.indexSublines(mishnaDoc.lines).get(sublineIndex);
    if (!subline) {
      throw new HttpException(
        `Subline ${sublineIndex} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const categories = subline.categories ?? [];
    switch (dto.action) {
      case 'approveAll':
        for (const cat of categories) delete cat.status;
        delete subline.pendingOriginalCategories;
        break;
      case 'dismissAll':
        subline.categories = subline.pendingOriginalCategories ?? [];
        delete subline.pendingOriginalCategories;
        break;
      case 'approveCategory': {
        if (!dto.categoryId) {
          throw new HttpException(
            'categoryId is required for approveCategory',
            HttpStatus.BAD_REQUEST,
          );
        }
        const cat = categories.find(
          (c) => c.categoryId === dto.categoryId && c.status === 'pending',
        );
        if (cat) delete cat.status;
        this.clearSnapshotIfResolved(subline);
        break;
      }
      case 'dismissCategory': {
        if (!dto.categoryId) {
          throw new HttpException(
            'categoryId is required for dismissCategory',
            HttpStatus.BAD_REQUEST,
          );
        }
        subline.categories = categories.filter(
          (c) => !(c.categoryId === dto.categoryId && c.status === 'pending'),
        );
        this.clearSnapshotIfResolved(subline);
        break;
      }
    }

    mishnaDoc.markModified('lines');
    await mishnaDoc.save();
    return {
      success: true,
      subline: {
        index: subline.index,
        categories: subline.categories ?? [],
      },
    };
  }

  /** Drops the restore snapshot once a subline has no pending categories left. */
  private clearSnapshotIfResolved(subline: SubLine): void {
    const stillPending = (subline.categories ?? []).some(
      (c) => c.status === 'pending',
    );
    if (!stillPending) delete subline.pendingOriginalCategories;
  }

  /** Builds an index → SubLine map across all lines of a mishna doc. */
  private indexSublines(lines: Line[]): Map<number, SubLine> {
    const map = new Map<number, SubLine>();
    for (const line of lines ?? []) {
      for (const subline of line.sublines ?? []) {
        map.set(subline.index, subline);
      }
    }
    return map;
  }
}

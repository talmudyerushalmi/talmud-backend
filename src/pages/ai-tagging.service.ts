import { Injectable } from '@nestjs/common';
import * as JSZip from 'jszip';
import { MishnaRepository } from './mishna.repository';
import {
  buildExportGroups,
  buildSugyaFilename,
  buildSugyotForChapter,
  groupToJsonl,
  SugyaListing,
  SugyaRef,
} from './inc/aiTaggingExport';

/**
 * Read-only helper backing the admin AI-tagging export page.
 * Reads raw Mishna docs (no override composition) — the export is intentionally
 * a snapshot of the source annotations, not the composed view.
 */
@Injectable()
export class AiTaggingService {
  constructor(private readonly mishnaRepository: MishnaRepository) {}

  /**
   * One entry per named sugya in the chapter, in halacha order. Powers the
   * checkbox list the editor picks from.
   */
  async listSugyotForChapter(
    tractate: string,
    chapter: string,
  ): Promise<SugyaListing[]> {
    const mishnaiot = await this.mishnaRepository.getAllChapter(
      tractate,
      chapter,
    );
    return buildSugyotForChapter(mishnaiot);
  }

  /**
   * Bundles the selected sugyot into a single ZIP containing one JSONL file
   * per sugya. Returns the archive as an in-memory buffer along with the
   * count of files inside (useful for logging / response headers).
   *
   * Refs that don't resolve (unknown halacha, out-of-range index, anonymous
   * block) are silently skipped so a partially-stale selection still yields
   * a usable archive of the surviving sugyot.
   */
  async buildZipExport(
    tractate: string,
    chapter: string,
    sugyot: SugyaRef[],
    includeTags: boolean,
  ): Promise<{ buffer: Buffer; fileCount: number }> {
    const mishnaiot = await this.mishnaRepository.getAllChapter(
      tractate,
      chapter,
    );
    const groups = buildExportGroups(
      tractate,
      chapter,
      mishnaiot,
      sugyot,
      includeTags,
    );

    const zip = new JSZip();
    // Guard against filename collisions when two sugyot happen to slugify the
    // same way (e.g. same Hebrew name reused across two halachas). The tuple
    // (halacha, sugyaIndex) is already unique, so a numeric suffix on collision
    // is enough — we won't hit this often, but silent overwrites would be bad.
    const usedNames = new Set<string>();
    for (const group of groups) {
      const base = buildSugyaFilename(group);
      let name = base;
      let n = 2;
      while (usedNames.has(name)) {
        const withoutExt = base.replace(/\.jsonl$/, '');
        name = `${withoutExt}__${n}.jsonl`;
        n += 1;
      }
      usedNames.add(name);
      zip.file(name, groupToJsonl(group));
    }

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      // DEFLATE with default compression — JSONL is very compressible (repeated
      // keys), so the archive is tiny even for whole-chapter exports.
      compression: 'DEFLATE',
    });
    return { buffer, fileCount: groups.length };
  }
}

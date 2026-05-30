import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { iTractate } from './pages.service';
import { InternalParallelLink } from './models/line.model';
import MiscUtils from '../shared/MiscUtils';
import { HalachaOverrideService } from './halacha-override.service';
import { HalachaOverrideRepository } from './halacha-override.repository';

export enum LinkFormat {
  TractateChapterMishna = 'TractateChapterMishna',
}
@Injectable()
export class NavigationService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    private halachaOverrideService: HalachaOverrideService,
    private halachaOverrideRepository: HalachaOverrideRepository,
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}


  async getAllTractates(): Promise<iTractate[]> {
    return this.tractateRepository.getAll();
  }

  /**
   * Returns the nav payload (lines / previous / next / daf / amud) used by the chapter +
   * mishna chooser and the prev/next arrows. This is a separate code path from `getMishna`,
   * so it has its own override application — without it, the arrows would still try to
   * navigate to unified second-source URLs (which then `_redirectTo` back, creating loops).
   *
   *   - Unify: returns combined lines, `previous = first.previous`, `next = second.next`
   *     so arrows skip the pair entirely.
   *   - Passthrough: rewrites any `previous`/`next` marker that points at a unify's second
   *     source to the canonical first source.
   *   - Split: passthrough (the source mishna's full line list is returned; per-part line
   *     navigation is handled by the in-page tab strip).
   */
  async getMishnaForNavigation(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<any> {
    const override = await this.halachaOverrideRepository.findByChapter(
      tractate,
      chapter,
    );
    const operations = override?.operations ?? [];

    const unify = operations.find(
      (op): op is Extract<typeof operations[number], { kind: 'unify' }> =>
        op.kind === 'unify' && op.sources.includes(mishna),
    );

    if (unify) {
      const sourceDocs = await Promise.all(
        unify.sources.map((id) =>
          this.mishnaRepository.find(tractate, chapter, id),
        ),
      );
      if (sourceDocs.some((d) => !d)) {
        throw new HttpException('Could not find mishna', 404);
      }
      const first = sourceDocs[0]!;
      const last = sourceDocs[sourceDocs.length - 1]!;
      const lines = sourceDocs
        .flatMap((d) => d!.lines ?? [])
        .map((l) => ({ lineNumber: l.lineNumber, mainLine: l.mainLine }));
      // Apply `rewriteMarker` so any neighbor in another unify group is canonicalized.
      const previous = this.halachaOverrideService.rewriteMarker(
        first.previous,
        operations,
      );
      const next = this.halachaOverrideService.rewriteMarker(
        last.next,
        operations,
      );
      return {
        // Echo the requested id; even if the user hit a non-first source, the corresponding
        // `_redirectTo` from `pages.service` keeps the URL canonical.
        mishna,
        id: first.guid,
        lines,
        previous,
        next,
        daf: first.daf,
        amud: first.amud,
      };
    }

    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    if (!mishnaDoc) {
      throw new HttpException('Could not find mishna', 404);
    }
    const lines = mishnaDoc?.lines.map(l => {
      return { lineNumber: l.lineNumber, mainLine: l.mainLine };
    });
    return {
      mishna: mishnaDoc.mishna,
      id: mishnaDoc.guid,
      lines,
      previous: this.halachaOverrideService.rewriteMarker(
        mishnaDoc.previous,
        operations,
      ),
      next: this.halachaOverrideService.rewriteMarker(
        mishnaDoc.next,
        operations,
      ),
      daf: mishnaDoc.daf,
      amud: mishnaDoc.amud,
    };
  }

  async getLinesForNavigation(
    tractate: string,
    chapter: string,
    mishna: string,
  ): Promise<string[]> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lines = mishnaDoc.lines.map(l => {
      return l.lineNumber;
    });

    return lines;
  }

 
  getLinkText(
    link: InternalParallelLink,
    format = LinkFormat.TractateChapterMishna,
  ) {
    switch (format) {
      case LinkFormat.TractateChapterMishna:
      default:
        const tractate = this.tractateRepository.getCachedTractate(link.tractate)        
        return `${tractate.title_heb} ${MiscUtils.hebrewMap.get(parseInt(link.chapter))} ${MiscUtils.hebrewMap.get(parseInt(link.mishna))}`;
    }
  }
}

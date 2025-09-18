import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { UpdateLineDto } from './dto/update-line.dto';
import { UpdateNosachDto } from './dto/update-nosach.dto';
import { SubLine } from './models/line.model';
import {
  addBlockToContentState,
  createEditorContentFromText,
} from './inc/editorUtils';
import { LineService } from './line.service';
import { generateOriginalText } from './inc/draftjsUtils';

@Injectable()
export class SublineService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    private lineService: LineService,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  async updateLineParallels(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    parallels: any[],
  ): Promise<Mishna> {
    return this.lineService.setParallel(
      tractate,
      chapter,
      mishna,
      line,
      parallels,
    );
  }

  async updateSubline(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    updateLineDto: UpdateLineDto,
  ): Promise<Mishna> {
    if (updateLineDto.parallels) {
      await this.lineService.setParallel(
        tractate,
        chapter,
        mishna,
        line,
        updateLineDto.parallels,
      );
    }
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lineIndex = mishnaDoc.lines.findIndex((l) => l.lineNumber === line);
    mishnaDoc.lines[lineIndex].sublines = updateLineDto.sublines;
    mishnaDoc.lines[lineIndex].sublines.forEach((subline) => {
      subline.originalText = generateOriginalText(subline.nosach);
    });
    mishnaDoc.markModified('lines');
    return mishnaDoc.save();
  }

  async updateSublines(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    updateNosachDto: UpdateNosachDto,
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lineIndex = mishnaDoc.lines.findIndex((l) => l.lineNumber === line);
    const lineToUpdate = mishnaDoc.lines[lineIndex];
    if (!lineToUpdate.sublines) {
      throw new HttpException(
        'Sublines empty!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const sublineToUpdate = lineToUpdate.sublines.find(
      (line) => line.index === updateNosachDto.sublineIndex,
    );
    const synopsisToSave = sublineToUpdate.synopsis;
    const emptySynopsis = synopsisToSave.map((s) => {
      return { ...s, text: { content: null, simpleText: '' } };
    });

    const newSublines: SubLine[] = updateNosachDto.nosach.map(
      (sublineNosach, index) => {
        return {
          text: updateNosachDto.nosachText[index],
          index: null,
          nosach: sublineNosach,
          synopsis: emptySynopsis,
          originalText: generateOriginalText(sublineNosach),
        };
      },
    );
    newSublines[0].synopsis = synopsisToSave;
    const sublineArrayIndex = lineToUpdate.sublines.findIndex(
      (subline) => subline.index === updateNosachDto.sublineIndex,
    );
    lineToUpdate.sublines.splice(sublineArrayIndex, 1, ...newSublines);
    mishnaDoc.updateSublinesIndex();
    mishnaDoc.updateExcerpts();

    const res = await mishnaDoc.save();
    // @ts-ignore
    return await { ...res._doc };
    // return mishnaDoc;
  }

  async deleteSubline(
    tractate: string,
    chapter: string,
    mishna: string,
    line: string,
    subline: number,
  ): Promise<Mishna> {
    const mishnaDoc = await this.mishnaRepository.find(
      tractate,
      chapter,
      mishna,
    );
    const lineIndex = mishnaDoc.lines.findIndex((l) => l.lineNumber === line);
    const [sublineToDelete, indexInLine] = mishnaDoc.getSubline(subline);
    const [sublineToUpdate] = mishnaDoc.getSubline(subline - 1);

    sublineToUpdate.synopsis.forEach((synopsis) => {
      const synop = sublineToDelete.synopsis.find((s) => s.id === synopsis.id);
      synopsis.text.simpleText =
        synopsis.text.simpleText + ' ' + synop.text.simpleText;
      synopsis.text.content = createEditorContentFromText(
        synopsis.text.simpleText,
      );
    });

    sublineToUpdate.text =
      sublineToUpdate.text.replace(/[\n\r]+/g, '') + ' ' + sublineToDelete.text;

    sublineToUpdate.nosach = addBlockToContentState(
      sublineToUpdate.nosach,
      sublineToDelete.nosach.blocks[0],
      sublineToDelete.nosach.entityMap,
    );

    // .blocks.push(...sublineToDelete.nosach.blocks);
    // delete
    mishnaDoc.lines[lineIndex].sublines.splice(indexInLine, 1);

    mishnaDoc.updateSublinesIndex();
    mishnaDoc.updateExcerpts();

    const res = await mishnaDoc.save();
    // @ts-ignore
    return await { ...res._doc };
    // return mishnaDoc;
  }
}

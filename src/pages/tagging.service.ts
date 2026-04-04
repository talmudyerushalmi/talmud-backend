import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MishnaRepository } from './mishna.repository';
import { UpdateSublineTagsDto } from './dto/update-subline-tags.dto';

@Injectable()
export class TaggingService {
  constructor(
    private mishnaRepository: MishnaRepository,
  ) {}

  async getSublines(tractate: string, chapter: string, mishna: string) {
    const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
    if (!mishnaDoc) {
      throw new HttpException('Mishna not found', HttpStatus.NOT_FOUND);
    }
    return mishnaDoc.lines.flatMap(line =>
      (line.sublines || []).map(subline => ({
        index: subline.index,
        text: subline.text,
        lineNumber: line.lineNumber,
        categories: subline.categories || [],
        rabbiMentions: subline.rabbiMentions || [],
        comments: subline.comments || [],
      }))
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

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { UpdateLineDto } from './dto/update-line.dto';
import { UpdateNosachDto } from './dto/update-nosach.dto';


@Injectable()
export class SublineService {
  constructor(
    private tractateRepository: TractateRepository,
    private mishnaRepository: MishnaRepository,
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  async updateSubline(
    tractate: string, chapter: string, mishna: string, line: string,
    updateLineDto: UpdateLineDto
  ): Promise<Mishna>{
      const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
      const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
      mishnaDoc.lines[lineIndex].sublines = updateLineDto.sublines;
      mishnaDoc.lines[lineIndex].sugiaName = updateLineDto.sugiaName;
      mishnaDoc.markModified('lines');
      return mishnaDoc.save();

  }

  
  async updateSublines(
    tractate: string, chapter: string, mishna: string, line: string,
    updateNosachDto: UpdateNosachDto
  ): Promise<Mishna>{
      const mishnaDoc = await this.mishnaRepository.find(tractate, chapter, mishna);
      const lineIndex = mishnaDoc.lines.findIndex(l => l.lineNumber === line);
      const newSublines = updateNosachDto.lines.map(l => { return {text:l, index:3, synopsis:[]}})
      mishnaDoc.lines[lineIndex].sublines = newSublines;
      mishnaDoc.updateSublines();
      mishnaDoc.updateExcerpts();
      return mishnaDoc.save();
  }





}

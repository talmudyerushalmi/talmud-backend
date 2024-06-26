import { Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Tractate } from './schemas/tractate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Mishna } from './schemas/mishna.schema';
import * as _ from 'lodash';

@Injectable()
export class TractateRepository implements OnModuleInit {
  tractates: Tractate[]
  constructor(
    @InjectModel(Tractate.name) private tractateModel: Model<Tractate>,
  ) {}

  async get(tractate: string, populated = false): Promise<Tractate> {
    if (!populated) {
      return this.tractateModel.findOne({id:tractate});
    } else {
      return this.tractateModel.findOne({id:tractate})
     .populate({path:'chapters.mishnaiot.mishnaRef',model:'Mishna'});

    }
    
  }

  async onModuleInit() {
    this.tractates = await this.getAll();
  }
  
  getCachedTractate(tractate: string): Tractate {
    return this.tractates.find(t => t.id === tractate)
  }

  async getAll() : Promise<any> {
    return this.tractateModel.find();
  }
  async upsert(tractate: string, updateDto:Object | null = null): Promise<Tractate> {
    return this.tractateModel.findOneAndUpdate(
      { id: tractate },
      {
        id: tractate,
        ...updateDto
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  addMishnaToChapter(tractateDocument: Tractate, mishnaDocument: Mishna) {
    const chapters = tractateDocument.chapters;
    let indexChapter = chapters.findIndex(
      chapter => chapter.id === mishnaDocument.chapter,
    );

    if (indexChapter === -1) {
      // first chapter insert
      tractateDocument.chapters.push({
        id: mishnaDocument.chapter,
        mishnaiot: [],
      });
      indexChapter = indexChapter = chapters.findIndex(
        chapter => chapter.id === mishnaDocument.chapter,
      );
    }

    const indexMishna = chapters[indexChapter].mishnaiot.findIndex(
      mishna => mishna.id === mishnaDocument.id,
    );

    // if mishna doesn't exist
    if (indexMishna === -1) {
      chapters[indexChapter].mishnaiot.push({
        id: mishnaDocument.id,
        mishna: mishnaDocument.mishna,
        //@ts-ignore //todo fix
        mishnaRef: mishnaDocument._id,
      });
      chapters[indexChapter].mishnaiot = _.orderBy(
        chapters[indexChapter].mishnaiot,
        ['id'],
        ['asc'],
      );
    }

    tractateDocument.markModified('chapters');
  }
}

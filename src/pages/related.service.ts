import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { RelatedRepository } from './related.repository';
export interface iTractate {
  title_eng: string;
  title_heb: string;
}
@Injectable()
export class RelatedService {
  constructor(
    private relatedRepository: RelatedRepository,
  ) {}

  async getRelated(tractate: string, chapter: string): Promise<any> {
    return this.relatedRepository.find(tractate, chapter)
  }

}

import { Injectable } from '@nestjs/common';
import { ManuscriptsRepository } from './manuscripts.repository';
import { Manuscripts } from './schemas/manuscripts.schema';

@Injectable()
export class ManuscriptsService {
  constructor(private manuscriptsRepository: ManuscriptsRepository) {}

  async getAllManuscripts(): Promise<Manuscripts[]> {
    return this.manuscriptsRepository.getAllManuscripts();
  }
}

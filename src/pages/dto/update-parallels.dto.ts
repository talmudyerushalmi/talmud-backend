import { IsArray } from 'class-validator';
import { InternalParallelLink } from '../models/line.model';

export class UpdateParallelsDto {
  @IsArray()
  parallels: InternalParallelLink[];
}

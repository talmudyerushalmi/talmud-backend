import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InternalParallelLink } from '../models/line.model';

export class UpdateParallelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalParallelLink)
  parallels: InternalParallelLink[];
}

import { IsArray, IsOptional, IsString } from 'class-validator';
import { InternalLink, SubLine } from '../models/line.model';

export class UpdateLineDto {
  @IsOptional()
  mainLine: any;  
  @IsArray()
  sublines: SubLine[];
  @IsOptional()
  parallels?: InternalLink[];
}

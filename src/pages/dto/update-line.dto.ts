import { IsArray, IsOptional, IsString } from 'class-validator';
import { SubLine } from '../models/line.model';

export class UpdateLineDto {
  @IsOptional()
  mainLine: any;  
  @IsArray()
  sublines: SubLine[];
  @IsString()
  sugiaName?: string;
}

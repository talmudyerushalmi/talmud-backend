import { Line } from '../models/line.model';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMishnaDto {
  @IsNotEmpty()
  guid: string;
  @IsArray()
  lines?: Line[];
  @IsString()
  mishnaText?: string;
}

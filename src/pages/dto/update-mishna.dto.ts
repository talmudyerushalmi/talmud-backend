import { Line } from '../models/line.model';
import { IsNotEmpty } from 'class-validator';

export class UpdateMishnaDto {
  @IsNotEmpty()
  guid: string;
  lines?: Line[];
  mishnaText?: string;
}

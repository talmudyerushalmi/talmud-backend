import { Line } from '../models/line.model';
import { IsNotEmpty } from 'class-validator';

export class UpdatePageDto {
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  lines: Line[];
}

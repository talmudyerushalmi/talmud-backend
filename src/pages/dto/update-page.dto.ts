import { Line } from '../line.model';
import { IsNotEmpty } from 'class-validator';

export class UpdatePageDto {
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  lines: Line[];
}

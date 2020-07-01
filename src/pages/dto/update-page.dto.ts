import { Line } from '../page.model';
import { IsNotEmpty } from 'class-validator';

export class UpdatePageDto {
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  lines: Line[];
}

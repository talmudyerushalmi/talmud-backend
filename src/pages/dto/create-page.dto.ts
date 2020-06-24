import { PageLine } from '../page.model';
import { IsNotEmpty } from 'class-validator';

export class CreatePageDto {
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  lines: PageLine[];
}

import { PageLine } from '../page.model';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMishnaDto {
  @ValidateNested()
  lines: PageLine[];

  @ValidateNested()
  test: PageLine;

  @Type(()=>PageLine)
  test2: PageLine;
}

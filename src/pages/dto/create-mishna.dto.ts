import { Line } from '../page.model';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMishnaDto {

  @ValidateNested({each:true})
  @Type(()=>Line)
  lines: Line[];

  @ValidateNested({each:true})
  @Type(()=>Line)
  test: Line;

  @ValidateNested()
  @Type(()=>Line)
  test2: Line;
}

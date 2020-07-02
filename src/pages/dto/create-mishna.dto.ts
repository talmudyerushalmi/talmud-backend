import { Line } from '../line.model';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMishnaDto {

  @ValidateNested({each:true})
  @Type(()=>Line)
  lines?: Line[];

  @ValidateNested({each:true})
  @Type(()=>Line)
  test?: Line;

  test2?: string;
}

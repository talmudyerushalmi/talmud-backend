import { SubLine } from '../models/line.model';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMishnaLineDto {


  @ValidateNested({each:true})
  @Type(()=>SubLine)
  sublines?: SubLine[]
  


}

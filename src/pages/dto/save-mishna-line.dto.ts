import { SubLine } from '../line.model';
import { ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMishnaLineDto {


  @ValidateNested({each:true})
  @Type(()=>SubLine)
  sublines?: SubLine[]
  


}

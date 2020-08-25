import { Line } from '../models/line.model';
import { ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMishnaDto {

  @IsString()
  tractate?: string;

  @IsString()
  chapter?:string;

  @ValidateNested({each:true})
  @Type(()=>Line)
  lines?: Line[];

}

import { Line } from '../line.model';
import { ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMishnaDto {

  @IsString()
  tractate?: string;

  @IsString()
  chapter?:string;

  @ValidateNested({each:true})
  @Type(()=>Line)
  lines?: Line[];

  @ValidateNested({each:true})
  @Type(()=>Line)
  test?: Line;

  test2?: string;
}

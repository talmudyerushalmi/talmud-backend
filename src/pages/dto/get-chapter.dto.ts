import { Transform } from 'class-transformer';
import {  IsNumber, IsOptional } from 'class-validator';
import { toNumber } from '../../helpers/cast.helper';


export class GetChapterDTO {
    @Transform( (val:any)=>toNumber(val, {default:1, min:1}))
    @IsNumber()
    @IsOptional()
    public mishna: number;
  }
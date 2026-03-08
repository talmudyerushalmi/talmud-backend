import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RabbiMentionDto {
  @IsString()
  rabbiId: string;

  @IsString()
  rabbiName: string;

  @IsNumber()
  startIndex: number;

  @IsNumber()
  endIndex: number;

  @IsString()
  text: string;
}

export class UpdateSublineTagsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  connections?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RabbiMentionDto)
  rabbiMentions?: RabbiMentionDto[];
}

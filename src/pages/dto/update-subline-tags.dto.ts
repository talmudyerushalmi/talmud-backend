import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryConnectionDto {
  @IsString()
  type: 'subline' | 'external';

  @IsOptional()
  @IsNumber()
  sublineIndex?: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class SublineCategoryDto {
  @IsString()
  categoryId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryConnectionDto)
  connections: CategoryConnectionDto[];
}

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

  @IsOptional()
  @IsBoolean()
  doubt?: boolean;
}

export class SublineCommentDto {
  @IsString()
  text: string;

  @IsString()
  author: string;

  @IsString()
  timestamp: string;
}

export class UpdateSublineTagsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SublineCategoryDto)
  categories?: SublineCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RabbiMentionDto)
  rabbiMentions?: RabbiMentionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SublineCommentDto)
  comments?: SublineCommentDto[];
}

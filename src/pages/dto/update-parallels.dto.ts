import { IsArray, IsString, IsOptional, ValidateNested, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for subline pairs validation
export class SublinePairDto {
  @IsNumber()
  @IsInt()
  @Min(0)
  sourceIndex: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  targetIndex: number;
}

// DTO for parallel link validation
export class ParallelLinkDto {
  @IsOptional()
  @IsString()
  linkText?: string;

  @IsString()
  tractate: string;

  @IsString()
  chapter: string;

  @IsString()
  mishna: string;

  @IsString()
  lineNumber: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SublinePairDto)
  sublinePairs?: SublinePairDto[];
}

export class UpdateParallelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParallelLinkDto)
  parallels: ParallelLinkDto[];
}

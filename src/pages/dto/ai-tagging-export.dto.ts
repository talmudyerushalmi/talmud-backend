import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Identifies a single named sugya inside a chapter. `sugyaIndex` is 0-based
 * within `extractSugias(halacha.lines)` and refers to a NAMED block only —
 * anonymous intro blocks are unreachable from the export UI.
 */
export class SugyaRefDto {
  @IsString()
  @IsNotEmpty()
  halacha: string;

  @IsInt()
  @Min(0)
  sugyaIndex: number;
}

/**
 * Body of `POST /edit/ai-tagging/export`. Tractate + chapter are in the body
 * (not the path) so the export payload — which is the auditable thing — is
 * self-contained.
 */
export class ExportSugyotDto {
  @IsString()
  @IsNotEmpty()
  tractate: string;

  @IsString()
  @IsNotEmpty()
  chapter: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SugyaRefDto)
  sugyot: SugyaRefDto[];

  /** When false, JSONL records omit the `annotations` field entirely. */
  @IsBoolean()
  includeTags: boolean;
}

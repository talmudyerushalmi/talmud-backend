import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One AI-suggested category for a subline, as normalized by the FE from the
 * uploaded results file (`categories[].id` → `categoryId`, `categories[].reason`).
 * Connections are never provided by the AI — editors add them after approval.
 */
export class AiCategorySuggestionDto {
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/** AI suggestions for a single subline, keyed by the global `SubLine.index`. */
export class AiSublineSuggestionDto {
  @IsNumber()
  sublineIndex: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiCategorySuggestionDto)
  categories: AiCategorySuggestionDto[];
}

/**
 * Payload for applying a sugya's worth of AI suggestions. Each listed subline
 * has its current categories snapshotted and replaced with pending suggestions.
 */
export class ApplyAiTagsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiSublineSuggestionDto)
  sublines: AiSublineSuggestionDto[];
}

export type ResolveAiAction =
  | 'approveCategory'
  | 'dismissCategory'
  | 'approveAll'
  | 'dismissAll';

/**
 * Resolves pending AI tags on one subline. `categoryId` is required for the
 * per-category actions and ignored by the bulk actions.
 */
export class ResolveAiTagsDto {
  @IsIn(['approveCategory', 'dismissCategory', 'approveAll', 'dismissAll'])
  action: ResolveAiAction;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

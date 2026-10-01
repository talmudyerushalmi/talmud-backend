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
 * One cross-reference the AI attached to a category (e.g. "this קושיה relates
 * back to subline 159"). Mirrors `CategoryConnection` in `line.model.ts`.
 */
export class AiConnectionDto {
  @IsIn(['subline', 'external'])
  type: 'subline' | 'external';

  @IsOptional()
  @IsNumber()
  sublineIndex?: number;

  @IsOptional()
  @IsString()
  text?: string;
}

/**
 * One AI-suggested category for a subline, as normalized by the FE from the
 * uploaded results file (`categories[].id` → `categoryId`, plus `reason` and
 * optional `connections`). Connections from recent AI pipelines point at other
 * sublines in the same sugya ({type: 'subline', sublineIndex: N}); editors can
 * add or remove them after approval.
 */
export class AiCategorySuggestionDto {
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiConnectionDto)
  connections?: AiConnectionDto[];
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

/**
 * Payload for saving the single global AI-tagging instruction document (the
 * plain-text "instruction file" editors send to the AI alongside a sugya).
 */
export class SaveAiInstructionsDto {
  @IsString()
  content: string;
}

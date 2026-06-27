import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Position inside a Mishna's `richTextMishna` (Draft.js content) where a split cuts.
 * The slicer applies the cut as: text before [0..offset) goes to the part to the left,
 * text from [offset..end) goes to the part to the right.
 */
export class MishnaCutDto {
  @IsString()
  @IsNotEmpty()
  blockKey: string;

  @IsInt()
  @Min(0)
  offset: number;
}

/**
 * Merge 2 or 3 adjacent source Halachas into one virtual Halacha.
 * `sources` is the source Halacha ids in chapter order, e.g. ['006','007','008'].
 * Adjacency and existence are enforced semantically in the service.
 */
export class UnifyOperationDto {
  @Equals('unify')
  kind: 'unify';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  sources: string[];
}

/**
 * Split one source Halacha into 2 or 3 mini-Halachas.
 *
 * `sugiaBoundaries` (length 1 or 2): indices in the source's ordered sugia list
 * at which each new part begins. e.g. `[2]` on 4 sugias → part1=[0,1], part2=[2,3].
 * `mishnaCuts.length` MUST equal `sugiaBoundaries.length` — paired index-by-index.
 *
 * Concrete semantic validation (boundaries in range, ≥1 sugia per part, cuts inside
 * the source's richTextMishna) happens in the service.
 */
export class SplitOperationDto {
  @Equals('split')
  kind: 'split';

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsInt({ each: true })
  @Min(1, { each: true })
  sugiaBoundaries: number[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => MishnaCutDto)
  mishnaCuts: MishnaCutDto[];
}

/**
 * The polymorphic operation envelope. We use class-transformer's discriminator
 * on `kind` so nested validation runs against the correct DTO. Anything outside
 * {'unify','split'} is rejected by `@IsIn` before discrimination kicks in,
 * preventing structural surprises.
 */
export class HalachaOperationDto {
  @IsIn(['unify', 'split'])
  kind: 'unify' | 'split';
}

export class UpsertHalachaOverrideDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HalachaOperationDto, {
    discriminator: {
      property: 'kind',
      subTypes: [
        { value: UnifyOperationDto, name: 'unify' },
        { value: SplitOperationDto, name: 'split' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  operations: (UnifyOperationDto | SplitOperationDto)[];
}

import { BadRequestException } from '@nestjs/common';
import {
  SplitOperationDto,
  UnifyOperationDto,
} from '../dto/halacha-override.dto';
import { Mishna } from '../schemas/mishna.schema';
import { extractSugias } from './sugiaUtils';

/**
 * Validates the operations payload submitted to `upsertOverride`. Throws
 * `BadRequestException` with a precise message on the first violation.
 *
 * DTO-level validation (shapes/types/cardinality) is already handled by class-validator
 * on `UpsertHalachaOverrideDto`. What this function adds is SEMANTIC validation against
 * the actual chapter contents: source existence, adjacency, uniqueness across ops,
 * sugia coverage for splits, and richTextMishna cut positions.
 */
export function validateOperations(
  operations: (UnifyOperationDto | SplitOperationDto)[],
  mishnas: Mishna[],
): void {
  const sourceIds = mishnas.map((m) => m.mishna);
  const sourceSet = new Set(sourceIds);

  // Source-uniqueness across operations: every referenced source can appear in at most one op.
  const claimed = new Set<string>();
  const claim = (id: string, opIdx: number) => {
    if (claimed.has(id)) {
      throw new BadRequestException(
        `Halacha "${id}" is referenced by more than one operation (operation index ${opIdx})`,
      );
    }
    claimed.add(id);
  };

  operations.forEach((op, opIdx) => {
    if (op.kind === 'unify') {
      validateUnify(op, sourceIds, sourceSet, opIdx);
      op.sources.forEach((s) => claim(s, opIdx));
    } else if (op.kind === 'split') {
      validateSplit(op, sourceSet, mishnas, opIdx);
      claim(op.source, opIdx);
    } else {
      // Should be impossible after DTO validation; defensive guard.
      throw new BadRequestException(
        `Unknown operation kind at index ${opIdx}`,
      );
    }
  });
}

function validateUnify(
  op: UnifyOperationDto,
  sourceIds: string[],
  sourceSet: Set<string>,
  opIdx: number,
): void {
  if (op.sources.length < 2 || op.sources.length > 3) {
    throw new BadRequestException(
      `Unify operation ${opIdx}: must have 2 or 3 sources (got ${op.sources.length})`,
    );
  }
  if (new Set(op.sources).size !== op.sources.length) {
    throw new BadRequestException(
      `Unify operation ${opIdx}: sources must be DISTINCT halachas`,
    );
  }
  for (const s of op.sources) {
    if (!sourceSet.has(s)) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: source halacha not found in chapter (${s})`,
      );
    }
  }
  // Each consecutive pair must be adjacent in the chapter's halacha order.
  for (let i = 1; i < op.sources.length; i++) {
    const prevIdx = sourceIds.indexOf(op.sources[i - 1]);
    const currIdx = sourceIds.indexOf(op.sources[i]);
    if (currIdx !== prevIdx + 1) {
      throw new BadRequestException(
        `Unify operation ${opIdx}: sources must be ADJACENT in chapter order (got ${op.sources.join(',')})`,
      );
    }
  }
}

function validateSplit(
  op: SplitOperationDto,
  sourceSet: Set<string>,
  mishnas: Mishna[],
  opIdx: number,
): void {
  if (!sourceSet.has(op.source)) {
    throw new BadRequestException(
      `Split operation ${opIdx}: source halacha not found (${op.source})`,
    );
  }
  if (op.sugiaBoundaries.length !== op.mishnaCuts.length) {
    throw new BadRequestException(
      `Split operation ${opIdx}: sugiaBoundaries and mishnaCuts must have equal length`,
    );
  }

  const sourceMishna = mishnas.find((m) => m.mishna === op.source);
  const sugias = extractSugias(sourceMishna.lines ?? []);
  const sugiaCount = sugias.length;
  const partCount = op.sugiaBoundaries.length + 1;

  if (sugiaCount < partCount) {
    throw new BadRequestException(
      `Split operation ${opIdx}: source halacha "${op.source}" has only ${sugiaCount} sugia(s); ` +
        `cannot split into ${partCount} parts (each part needs ≥1 sugia)`,
    );
  }

  // Strictly increasing, all in (0, sugiaCount); first part is sugias[0..b0-1],
  // second is sugias[b0..b1-1], etc. So every boundary must be ≥1 and ≤sugiaCount-1.
  let prev = 0;
  for (const b of op.sugiaBoundaries) {
    if (b <= prev || b >= sugiaCount) {
      throw new BadRequestException(
        `Split operation ${opIdx}: sugiaBoundaries must be strictly increasing in (0, ${sugiaCount}); got [${op.sugiaBoundaries.join(', ')}]`,
      );
    }
    prev = b;
  }

  // Each mishnaCut must address a real (blockKey, offset) inside richTextMishna.
  const rtm = sourceMishna.richTextMishna;
  if (!rtm || !Array.isArray(rtm.blocks) || rtm.blocks.length === 0) {
    throw new BadRequestException(
      `Split operation ${opIdx}: source halacha "${op.source}" has no richTextMishna to cut`,
    );
  }
  op.mishnaCuts.forEach((cut, cutIdx) => {
    const block = rtm.blocks.find((b) => b.key === cut.blockKey);
    if (!block) {
      throw new BadRequestException(
        `Split operation ${opIdx}: mishnaCut ${cutIdx} references unknown blockKey "${cut.blockKey}"`,
      );
    }
    const max = (block.text ?? '').length;
    if (cut.offset < 0 || cut.offset > max) {
      throw new BadRequestException(
        `Split operation ${opIdx}: mishnaCut ${cutIdx} offset ${cut.offset} out of range [0..${max}] for blockKey "${cut.blockKey}"`,
      );
    }
  });
}

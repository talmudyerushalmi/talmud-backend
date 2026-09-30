import { HalachaOperation } from '../schemas/halacha-override.schema';
import { unwrapMongoose } from './mongooseUtils';

/**
 * Pure helper: given a single neighbor marker (`previous` or `next`), returns a
 * canonicalized version where any reference to a NON-FIRST source of a unify (i.e.
 * sources[1] or sources[2]) is replaced with sources[0]. Used by the read path and
 * by `NavigationService`.
 */
export function rewriteMarker<T extends { mishna?: string } | undefined>(
  marker: T,
  operations: HalachaOperation[],
): T {
  if (!marker?.mishna) return marker;
  const unifies = operations.filter(
    (op): op is Extract<HalachaOperation, { kind: 'unify' }> => op.kind === 'unify',
  );
  // A marker is canonicalized if its mishna appears as a non-first source of any unify.
  const u = unifies.find((u) => u.sources.indexOf(marker.mishna!) > 0);
  if (!u) return marker;
  return { ...marker, mishna: u.sources[0] } as T;
}

/**
 * Rewrites `previous` / `next` markers on `mishna` so that any reference to a unify's
 * second source is replaced with the corresponding first source (the canonical URL).
 * Returns the Mishna unchanged if none of its markers point at a second source.
 */
export function rewriteNeighborMarkers(
  mishna: any,
  operations: HalachaOperation[],
): any {
  const base = unwrapMongoose(mishna);
  const newPrevious = rewriteMarker(base.previous, operations);
  const newNext = rewriteMarker(base.next, operations);
  if (newPrevious === base.previous && newNext === base.next) {
    return mishna;
  }
  return { ...base, previous: newPrevious, next: newNext };
}

/**
 * Builds a `sourceMishna -> (originalSublineIndex -> newLocalIndex)` lookup from
 * composed sublines. Each subline carries `_sourceMishna` and `_originalIndex`
 * markers stamped by composeSplit / composeUnify.
 *
 * Shared by every helper that needs to remap persisted subline references
 * (category connections, excerpt selections, ...) onto the renumbered space.
 */
export function buildSublineIndexMap(
  sublines: any[],
): Map<string, Map<number, number>> {
  const mapBySource = new Map<string, Map<number, number>>();
  for (const s of sublines) {
    const sourceKey = s._sourceMishna ?? '';
    if (!mapBySource.has(sourceKey)) {
      mapBySource.set(sourceKey, new Map());
    }
    if (s._originalIndex != null) {
      mapBySource.get(sourceKey)!.set(s._originalIndex, s.index);
    }
  }
  return mapBySource;
}

/**
 * Rewrites `categories[].connections[].sublineIndex` on the given composed sublines
 * to use the renumbered (local) indices. Each subline carries `_sourceMishna` and
 * `_originalIndex` markers (stamped by composeSplit/composeUnify), which we use to
 * build a per-source `originalIndex -> newIndex` lookup. Without this rewrite, the
 * tagged sidebar shows stale numbers ("שורה 5" when no subline 5 is in view) and
 * `CategoryConnectionLines` fails to find DOM refs by index.
 *
 * Connections of type `subline` whose original target is missing from the composed
 * slice (e.g. a tag on part 1 of a split that links into part 2) are dropped — the
 * intended workflow is split-first / tag-after, so cross-part connections are stale
 * mistakes rather than meaningful links. The persisted data is untouched on the
 * source mishna, so reverting the split brings them back.
 *
 * `external` connections (numeric-free text refs), `rabbiMentions` (char offsets,
 * not subline refs) and `comments` are left as-is.
 *
 * Mutates each subline's `categories` array in place.
 */
export function rewriteCategoryConnections(sublines: any[]): void {
  const mapBySource = buildSublineIndexMap(sublines);

  for (const s of sublines) {
    if (!s.categories?.length) continue;
    const map = mapBySource.get(s._sourceMishna ?? '');
    if (!map) continue;
    s.categories = s.categories.map((cat: any) => {
      const baseCat = unwrapMongoose(cat);
      const rewritten = (baseCat.connections ?? [])
        .map((c: any) => {
          const baseC = unwrapMongoose(c);
          if (baseC.type !== 'subline') return baseC;
          const newIdx =
            baseC.sublineIndex != null
              ? map.get(baseC.sublineIndex)
              : undefined;
          if (newIdx == null) return null; // cross-slice or unknown — drop
          return { ...baseC, sublineIndex: newIdx };
        })
        .filter((c: any) => c !== null);
      return { ...baseCat, connections: rewritten };
    });
  }
}

/**
 * Rewrites `selection.fromSubline` / `selection.toSubline` on composed excerpts
 * so the side panel ("add-ons" — talmudic parallels, citations, ...) highlights
 * the right lines after split / unify.
 *
 * Excerpt `fromLine` / `toLine` (array indices) are already shifted into the
 * composed line space at the point this is called. The subline refs are stored
 * as document-global `subline.index` values from the source mishna (see
 * `excerptUtils.ts`), so once compose renumbers sublines they're stale — exactly
 * the same bug class as `rewriteCategoryConnections`.
 *
 * The excerpt's `_sourceMishna` marker (stamped by both compose paths) tells us
 * which source map to apply. If a subline ref isn't in the map (defensive — for
 * a split the line-range filter should already have dropped the excerpt) the
 * field is left untouched rather than crashing the page.
 *
 * Returns a new array; never mutates the input excerpts.
 */
export function rewriteExcerptSelections(
  excerpts: any[],
  sublines: any[],
): any[] {
  const mapBySource = buildSublineIndexMap(sublines);
  return excerpts.map((e) => {
    const map = mapBySource.get(e._sourceMishna ?? '');
    if (!map || !e.selection) return e;
    const sel = e.selection;
    const fromSubline =
      sel.fromSubline != null ? map.get(sel.fromSubline) : undefined;
    const toSubline =
      sel.toSubline != null ? map.get(sel.toSubline) : undefined;
    return {
      ...e,
      selection: {
        ...sel,
        ...(fromSubline != null ? { fromSubline } : {}),
        ...(toSubline != null ? { toSubline } : {}),
      },
    };
  });
}

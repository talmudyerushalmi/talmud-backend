/**
 * Mongoose docs hold their pojo state under `_doc`. When spreading we want the plain
 * object — without this helper, `{ ...mongooseDoc }` includes hidden internals and
 * misses some virtuals. Safe for already-plain objects (returns them unchanged).
 */
export function unwrapMongoose<T = any>(doc: any): T {
  if (doc && typeof doc === 'object' && '_doc' in doc) {
    return { ...(doc as any)._doc } as T;
  }
  return { ...(doc ?? {}) } as T;
}

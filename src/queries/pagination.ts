type ItemPage<T> = {
  items: T[];
};

/** Backend pages and items are newest-first. Flatten only; never reverse or re-sort. */
export function flattenNewestFirstPages<T>(pages: ItemPage<T>[]): T[] {
  return pages.flatMap((page) => page.items);
}

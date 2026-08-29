export async function fetchAllSupabasePages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = 1_000,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1_000) {
    throw new Error('invalid_supabase_page_size');
  }

  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

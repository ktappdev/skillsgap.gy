const pageSize = 1000;

type PageResult<Row> = {
  data: Row[] | null;
  error: { message: string } | null;
};

export async function fetchAllRows<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<Row>>,
): Promise<Row[]> {
  const rows: Row[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw new Error(`Could not load paginated data: ${error.message}`);
    const currentPage = data ?? [];
    rows.push(...currentPage);
    if (currentPage.length < pageSize) return rows;
  }
}

export async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = Array(Math.min(limit, items.length))
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        const currentIdx = index++;
        if (currentIdx >= items.length) break;
        try {
          results[currentIdx] = await fn(items[currentIdx], currentIdx);
        } catch (err) {
          // Re-throw to fail the entire Promise.all or handle depending on requirements.
          // For now, we'll let it reject the main promise.
          throw err;
        }
      }
    });

  await Promise.all(workers);
  return results;
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

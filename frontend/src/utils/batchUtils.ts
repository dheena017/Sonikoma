export async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  abortSignal?: { aborted: boolean }
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let index = 0;

  const workers = Array(Math.min(limit, items.length))
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        if (abortSignal?.aborted) {
          break;
        }
        const currentIdx = index++;
        if (currentIdx >= items.length) break;
        try {
          results[currentIdx] = await fn(items[currentIdx], currentIdx);
        } catch (err) {
          // Do NOT re-throw — log and continue so the rest of the batch finishes
          console.error(`[processWithConcurrency] Item ${currentIdx} failed:`, err);
          results[currentIdx] = null;
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

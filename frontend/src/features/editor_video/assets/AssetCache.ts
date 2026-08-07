/** Simple in-memory LRU cache for resolved asset URLs. */

export class AssetCache {
  private store = new Map<string, string>();
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get(id: string): string | undefined {
    return this.store.get(id);
  }

  set(id: string, url: string): void {
    if (this.store.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(id, url);
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  invalidate(id: string): void {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

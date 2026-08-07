/**
 * AssetManager — Central asset registry.
 * Routes queries to the appropriate provider.
 * All UI components talk to AssetManager, never to providers directly.
 */

import { AssetProvider, AssetRecord } from "../providers";

export class AssetManager {
  private providers: AssetProvider[] = [];

  register(provider: AssetProvider): void {
    this.providers.push(provider);
  }

  async listAll(type?: AssetRecord["type"]): Promise<AssetRecord[]> {
    const results = await Promise.all(this.providers.map((p) => p.list()));
    const flat = results.flat();
    return type ? flat.filter((a) => a.type === type) : flat;
  }

  async getById(id: string): Promise<AssetRecord | null> {
    for (const provider of this.providers) {
      const asset = await provider.getById(id);
      if (asset) return asset;
    }
    return null;
  }
}

/** Singleton instance for the editor session. */
export const assetManager = new AssetManager();

/**
 * LocalMediaProvider — Serves media from the browser's local file system
 * via the File API. Falls back to an in-memory cache.
 */

import { AssetProvider, AssetRecord } from "../index";

export interface MediaAsset extends AssetRecord {
  type: "image" | "video";
  source: "local";
  mimeType: string;
  sizeBytes: number;
}

let _cache: MediaAsset[] = [];

export const LocalMediaProvider: AssetProvider<MediaAsset> = {
  name: "LocalMedia",

  async list() {
    return _cache;
  },

  async getById(id) {
    return _cache.find((a) => a.id === id) ?? null;
  },
};

/** Add a File object to the local media cache. */
export function addLocalFile(file: File): MediaAsset {
  const asset: MediaAsset = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: file.type.startsWith("video/") ? "video" : "image",
    source: "local",
    url: URL.createObjectURL(file),
    title: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
  _cache = [..._cache, asset];
  return asset;
}

export function clearLocalCache(): void {
  _cache.forEach((a) => URL.revokeObjectURL(a.url));
  _cache = [];
}

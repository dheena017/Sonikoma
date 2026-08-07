/**
 * providers/index.ts
 *
 * Feature-oriented asset providers.
 * Each provider returns the same Asset interface — the UI doesn't care
 * whether it came from local storage, a cloud API, or an AI generator.
 *
 * Subdirectories:
 *   media/       — LocalMediaProvider, CloudMediaProvider, GeneratedMediaProvider
 *   audio/       — MusicProvider, VoiceProvider
 *   story/       — StoryProvider
 *   templates/   — TemplateProvider
 *   marketplace/ — MarketplaceProvider
 */

export interface AssetRecord {
  id: string;
  type: "image" | "video" | "audio" | "template" | "story";
  source: "local" | "cloud" | "ai" | "marketplace";
  url: string;
  title: string;
  metadata?: Record<string, unknown>;
}

export interface AssetProvider<T extends AssetRecord = AssetRecord> {
  name: string;
  list(params?: Record<string, unknown>): Promise<T[]>;
  getById(id: string): Promise<T | null>;
}

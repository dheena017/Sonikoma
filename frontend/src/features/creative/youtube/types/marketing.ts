export type SocialPlatform = "youtube" | "tiktok" | "instagram";

export interface ConnectedSocialAccount {
  platform: SocialPlatform;
  handle: string;
  displayName: string;
  avatarUrl: string;
  isConnected: boolean;
  followersCount: string;
  autoPublish916: boolean;
  statusMessage?: string;
}

export interface ScheduledContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  videoFormat: "shorts" | "landscape";
  targetPlatforms: SocialPlatform[];
  scheduledIsoString: string;
  scheduledFormattedTime: string;
  dayOfWeek: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  isPeakViewerHour: boolean;
  status: "scheduled" | "publishing" | "published" | "failed";
  estimatedReach: string;
}

export interface ThumbnailABVariant {
  id: string;
  variantKey: "A" | "B" | "C";
  archetypeLabel: string;
  hookText: string;
  headline: string;
  imageUrl: string;
  predictedCtr: number; // e.g. 94.8%
  viralTier: "S-Tier (Viral Surge)" | "A-Tier (High Engagement)" | "B-Tier (Solid Baseline)";
  contrastRatio: string;
  facialClarityScore: number;
  isWinningPick?: boolean;
}

export interface ABTestingExperiment {
  id: string;
  seriesTitle: string;
  chapterNumber: number;
  rotationIntervalMinutes: number; // e.g. rotate every 120 or 240 mins
  variants: ThumbnailABVariant[];
  status: "active" | "concluded" | "draft";
  bestPerformingVariantId?: string;
}

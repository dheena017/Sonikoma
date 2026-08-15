export type FetchClient = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type ApiResponse<T> = T & {
  success?: boolean;
  message?: string;
  error?: string | { code: string; message: string; details?: any };
  detail?: string;
};

export interface CreditsPayload {
  credits: number;
  low_balance: boolean;
  threshold: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  feature_name: string;
  created_at: string;
  /** Running balance immediately after this transaction was applied (server-computed) */
  balance_after?: number;
}

// Auth Related Payload Types
export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface RegisterUserData {
  email?: string;
  password?: string;
  username?: string;
  [key: string]: any;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface UpdatePasswordPayload {
  old_password?: string;
  new_password?: string;
  [key: string]: any;
}

export interface CardData {
  number?: string;
  exp_month?: number;
  exp_year?: number;
  cvc?: string;
  [key: string]: any;
}

export interface PurchaseCreditsPayload {
  amount?: number;
  token?: string;
  [key: string]: any;
}

export interface CreateApiKeyPayload {
  name?: string;
  [key: string]: any;
}

export interface RedeemRewardPayload {
  reward_id?: string;
  points?: number;
  [key: string]: any;
}

// Projects Related Payload Types
export interface CreateProjectPayload {
  project_id?: string;
  job_id?: string | null;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface UpdateProjectPayload {
  job_id?: string | null;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface SaveScrapedImagesPayload {
  project_id?: string;
  scraped_images?: string[];
  [key: string]: any;
}

// Scraper Models matching authoritative ChapterResult
export interface ScraperSourceInfo {
  original_url: string;
  canonical_url: string;
  domain: string;
  platform?: string;
  chapter_id?: string;
  series_id?: string;
}

export interface ScraperSeriesInfo {
  title?: string;
  author?: string;
  cover_image?: string;
  description?: string;
  genres?: string[];
  series_url?: string;
}

export interface ScraperChapterInfo {
  number?: number | string;
  title?: string;
  url?: string;
  previous_chapter_url?: string;
  next_chapter_url?: string;
  release_date?: string;
}

export interface ScraperImageItem {
  index: number;
  url: string;
  width?: number;
  height?: number;
  is_new?: boolean;
  fingerprint?: string;
  origin?: string;
}

export interface ScraperMetadataInfo {
  image_count: number;
  new_image_count: number;
  completeness: "COMPLETE" | "PARTIAL" | "UNKNOWN" | "FAILED";
  duration_ms?: number;
  delivery_mechanism?: string;
  level_used?: string;
}

export interface ChapterResult {
  success: boolean;
  project_id?: string;
  job_id?: string;
  source: ScraperSourceInfo;
  series: ScraperSeriesInfo;
  chapter: ScraperChapterInfo;
  images: ScraperImageItem[];
  scrape: ScraperMetadataInfo;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ScrapeChapterPayload {
  url: string;
  project_id?: string;
  job_id?: string;
  force_refresh?: boolean;
  bypass_cache?: boolean;
  limit?: number;
  proxy_images?: boolean;
  filter_banners?: boolean;
  cookies?: string;
  headers?: Record<string, string>;
}

// ============================================================================
// Unified Job Types
// ============================================================================

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type JobType =
  // Scraping
  | "SCRAPE_CHAPTER"
  | "DISCOVER_EPISODES"
  | "BATCH_SCRAPE"
  | "BATCH_SERIES"
  | "PROCESS_URL"
  // Panel Processing
  | "PANEL_SPLIT"
  | "PANEL_DETECT"
  | "PANEL_DETECT_B64"
  | "PANEL_TRANSFORM"
  | "PANEL_CLEAN"
  | "PANEL_INPAINT"
  | "PANEL_UPSCALE"
  | "PANEL_COMPRESS"
  | "PANEL_WATERMARK"
  // OCR / Text
  | "OCR"
  | "OCR_B64"
  | "OCR_FULL"
  | "TRANSCRIBE_AUDIO"
  // AI Generation
  | "GENERATE_STORYBOARD"
  | "GENERATE_NARRATION"
  | "GENERATE_SEO"
  | "GENERATE_PLAYLIST"
  | "STABLE_DIFFUSION"
  | "AI_DETECT_PANELS"
  // Audio
  | "SYNTHESIZE_AUDIO"
  | "ANALYZE_AUDIO"
  | "MIX_AUDIO"
  // Video
  | "GENERATE_VIDEO"
  | "RENDER_VIDEO"
  | "COMPILE_VIDEO"
  | "TRANSCODE_VIDEO"
  // Export
  | "EXPORT_ARCHIVE"
  | "EXPORT_YOUTUBE"
  | "EXPORT_PDF"
  | "EXPORT_IMAGES"
  // Image Editing
  | "IMAGE_METADATA"
  | "IMAGE_MAGICK"
  // Project Lifecycle
  | "PROJECT_CREATE"
  | "PROJECT_PROMOTE"
  | "PROJECT_SYNC"
  | "BATCH_DELETE"
  // Platform / Maintenance
  | "CACHE_PURGE"
  | "TEMP_FLUSH"
  | "COPYRIGHT_CHECK";

export interface JobRecord<T = any> {
  job_id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  stage: string;
  project_id?: string;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
  result?: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
  metadata?: Record<string, any>;
}



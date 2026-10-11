/**
 * Workflow step logo assets for the Sonikoma Comic-to-Video Engine.
 * 
 * Provides references to the minimalist logo set:
 * - Step 01: Scrape URL (/workflow-logos/simple_scrape_logo.jpg)
 * - Step 02: Merge & Crop (/workflow-logos/simple_crop_logo.jpg)
 * - Step 03: AI Narrative (/workflow-logos/simple_narrative_logo.jpg)
 * - Step 04: Voice Audio (/workflow-logos/simple_voice_logo.jpg)
 * - Step 05: Video Render (/workflow-logos/simple_video_render_logo.jpg)
 */

export const WORKFLOW_LOGOS = {
  scrape: "/workflow-logos/simple_scrape_logo.jpg",
  crop: "/workflow-logos/simple_crop_logo.jpg",
  narrative: "/workflow-logos/simple_narrative_logo.jpg",
  voice: "/workflow-logos/simple_voice_logo.jpg",
  render: "/workflow-logos/simple_video_render_logo.jpg",
  youtube: "/workflow-logos/simple_youtube_logo.jpg",
  thumbnails: "/workflow-logos/simple_thumbnail_logo.jpg",
  translation: "/workflow-logos/simple_translation_logo.jpg",
  characters: "/workflow-logos/simple_character_logo.svg",
  series: "/workflow-logos/simple_series_studio_logo.svg",
} as const;

export interface WorkflowStageMeta {
  key: string;
  step: string;
  title: string;
  label: string;
  desc: string;
  description: string;
  logo: string;
  targetPath: string;
  badge: string;
  accentColor: string;
}

export const WORKFLOW_STAGES: WorkflowStageMeta[] = [
  {
    key: "scraping",
    step: "01",
    title: "Scrape URL",
    label: "Scrape URL",
    desc: "Fetching chapter & images",
    description: "Import chapters from URLs, Webtoons, MangaDex, or upload raw comic image files.",
    logo: WORKFLOW_LOGOS.scrape,
    targetPath: "/scraper",
    badge: "Ingestion Hub",
    accentColor: "#3B82F6",
  },
  {
    key: "processing_images",
    step: "02",
    title: "Merge & Crop",
    label: "Merge & Crop",
    desc: "Slicing clean story panels",
    description: "Auto-detect comic gutters, isolate panel boundaries, and slice vertical strips into frames.",
    logo: WORKFLOW_LOGOS.crop,
    targetPath: "/image-editor",
    badge: "Canny Edge CV",
    accentColor: "#8B5CF6",
  },
  {
    key: "generating_narrative",
    step: "03",
    title: "AI Narrative",
    label: "AI Narrative",
    desc: "Writing script & translation",
    description: "Detects speech bubbles, reconstructs background art, and transcribes spoken text for voice routing.",
    logo: WORKFLOW_LOGOS.narrative,
    targetPath: "/creative-suite",
    badge: "Vision Inpaint",
    accentColor: "#EC4899",
  },
  {
    key: "synthesizing_audio",
    step: "04",
    title: "Voice Audio",
    label: "Voice Audio",
    desc: "Neural voiceover sync",
    description: "Synthesizes emotive character voices, narrator recap tracks, and binds multi-speaker dialogue.",
    logo: WORKFLOW_LOGOS.voice,
    targetPath: "/characters",
    badge: "Kokoro & ElevenLabs",
    accentColor: "#06B6D4",
  },
  {
    key: "rendering_video",
    step: "05",
    title: "Video Render",
    label: "Video Render",
    desc: "Cinematic motion assembly",
    description: "Composites layered panels with camera zoom paths, particle effects, parallax motion, and 4K MP4 export.",
    logo: WORKFLOW_LOGOS.render,
    targetPath: "/video-editor",
    badge: "60 FPS WebGPU",
    accentColor: "#10B981",
  },
];

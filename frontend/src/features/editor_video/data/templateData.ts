import { TemplateProject } from "../types/workspace.types";

export const TEMPLATE_SUB_TABS = [
  "Manga",
  "Webtoon",
  "Anime",
  "Story Recap",
  "YouTube Shorts",
  "TikTok",
  "Reels",
  "Trailer",
  "Opening",
  "Ending",
];

export const PRESET_TEMPLATES: TemplateProject[] = [
  {
    id: "t-1",
    title: "Manhwa Split Panel Burst",
    category: "webtoon",
    badge: "16:9 • 0:30",
    gradient: "from-[#2A2A2A] via-neutral-900/70 to-[#121212]",
    accent: "text-[#3B82F6] border-[#3B82F6]/40 bg-[#3B82F6]/20",
    desc: "Fast panel cuts with dynamic lighting, speedlines, and battle BGM.",
  },
  {
    id: "t-2",
    title: "9:16 Vertical Scroll Shorts",
    category: "shorts",
    badge: "9:16 Shorts • 0:45",
    gradient: "from-amber-900/90 via-orange-900/70 to-[#121212]",
    accent: "text-amber-400 border-amber-500/40 bg-amber-500/20",
    desc: "Continuous vertical panel scroll optimized for mobile platforms.",
  },
  {
    id: "t-3",
    title: "Cyberpunk Anime Intro",
    category: "opening",
    badge: "Intro • 0:10",
    gradient: "from-neutral-900/90 via-blue-900/70 to-[#121212]",
    accent: "text-blue-400 border-blue-500/40 bg-blue-500/20",
    desc: "Glitch title reveal with synthwave audio transition and logo mark.",
  },
  {
    id: "t-4",
    title: "Episode Chapter Story Recap",
    category: "story-recap",
    badge: "Recap • 1:00",
    gradient: "from-rose-900/90 via-[#2A2A2A] to-[#121212]",
    accent: "text-rose-400 border-rose-500/40 bg-rose-500/20",
    desc: "Structured episode summary with lower thirds and voiceover narration.",
  },
  {
    id: "t-5",
    title: "15s Action Teaser Trailer",
    category: "trailer",
    badge: "Trailer • 0:15",
    gradient: "from-red-900/90 via-rose-900/70 to-[#121212]",
    accent: "text-red-400 border-red-500/40 bg-red-500/20",
    desc: "High energy 15-second teaser trailer edit with impact sound cues.",
  },
];

export const MOCK_TEMPLATES = PRESET_TEMPLATES;

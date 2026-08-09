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

export const MOCK_TEMPLATES: TemplateProject[] = [
  {
    id: "t-1",
    title: "Manhwa Split Panel Burst",
    category: "webtoon",
    badge: "16:9 • 0:30",
    gradient: "from-purple-900/90 via-indigo-900/70 to-slate-950",
    accent: "text-purple-400 border-purple-500/40 bg-purple-500/20",
    desc: "Fast panel cuts with dynamic lighting, speedlines, and battle BGM.",
  },
  {
    id: "t-2",
    title: "9:16 Vertical Scroll Shorts",
    category: "shorts",
    badge: "9:16 Shorts • 0:45",
    gradient: "from-amber-900/90 via-orange-900/70 to-slate-950",
    accent: "text-amber-400 border-amber-500/40 bg-amber-500/20",
    desc: "Continuous vertical panel scroll optimized for mobile platforms.",
  },
  {
    id: "t-3",
    title: "Cyberpunk Anime Intro",
    category: "opening",
    badge: "Intro • 0:10",
    gradient: "from-cyan-900/90 via-blue-900/70 to-slate-950",
    accent: "text-cyan-400 border-cyan-500/40 bg-cyan-500/20",
    desc: "Glitch title reveal with synthwave audio transition and logo mark.",
  },
  {
    id: "t-4",
    title: "Episode Chapter Story Recap",
    category: "story-recap",
    badge: "Recap • 1:00",
    gradient: "from-rose-900/90 via-purple-900/70 to-slate-950",
    accent: "text-rose-400 border-rose-500/40 bg-rose-500/20",
    desc: "Structured episode summary with lower thirds and voiceover narration.",
  },
  {
    id: "t-5",
    title: "15s Action Teaser Trailer",
    category: "trailer",
    badge: "Trailer • 0:15",
    gradient: "from-red-900/90 via-rose-900/70 to-slate-950",
    accent: "text-red-400 border-red-500/40 bg-red-500/20",
    desc: "High energy 15-second teaser trailer edit with impact sound cues.",
  },
];

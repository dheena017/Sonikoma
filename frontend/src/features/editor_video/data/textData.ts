// ─── textData ─────────────────────────────────────────────────────────────────
// Canonical location: features/editor_video/data/textData.ts
// Real Typography Presets using Google Fonts & Manga Styling

import { TextPreset } from "../types/workspace.types";

export const TEXT_SUB_TABS = [
  "All",
  "Titles",
  "Captions",
  "Speech Bubble",
  "Narration",
  "Typography",
  "Animations",
];

export const REAL_TEXT_PRESETS: TextPreset[] = [
  {
    id: "tp-bangers-shout",
    title: "Manga Action Shout (Bangers)",
    category: "titles",
    previewText: "STAND UP AND FIGHT!",
    fontFamily: "Bangers",
    styleClass: "tracking-wider uppercase text-yellow-300 drop-shadow-[0_4px_16px_rgba(234,179,8,0.9)] text-lg",
    badge: "Action Shout",
  },
  {
    id: "tp-cinzel-epic",
    title: "Dark Fantasy Epic Title (Cinzel)",
    category: "titles",
    previewText: "CHAPTER 1: THE SHADOW AWAKENING",
    fontFamily: "Cinzel",
    styleClass: "font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-400 to-indigo-400 drop-shadow-lg uppercase text-sm",
    badge: "Cinematic Title",
  },
  {
    id: "tp-marker-comic",
    title: "Hand-Drawn Comic Dialogue (Permanent Marker)",
    category: "speech-bubble",
    previewText: "“You have no idea what is coming...”",
    fontFamily: "Permanent Marker",
    styleClass: "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-sm tracking-wide",
    badge: "Dialogue Bubble",
  },
  {
    id: "tp-orbitron-system",
    title: "System Hologram Narration (Orbitron)",
    category: "narration",
    previewText: "[NOTIFICATION: PLAYER LEVEL INCREASED +10]",
    fontFamily: "Orbitron",
    styleClass: "font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1.5 rounded-lg border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.5)] text-xs",
    badge: "System Prompt",
  },
  {
    id: "tp-montserrat-sub",
    title: "Clean Anime Subtitle (Montserrat)",
    category: "captions",
    previewText: "At that moment, the shadows responded to his command.",
    fontFamily: "Montserrat",
    styleClass: "font-bold text-white bg-black/75 px-3 py-1 rounded-md border border-white/20 text-xs backdrop-blur-md",
    badge: "Clean Subtitle",
  },
  {
    id: "tp-noto-kanji",
    title: "Japanese Kanji SFX (Noto Sans JP)",
    category: "typography",
    previewText: "ドッドッドッ (DODODO - RUMBLE)",
    fontFamily: "Noto Sans JP",
    styleClass: "font-black text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] text-base tracking-widest",
    badge: "Kanji SFX",
  },
  {
    id: "tp-arcade-retro",
    title: "8-Bit Retro Gaming (Press Start 2P)",
    category: "animations",
    previewText: "STAGE 1: BOSS FIGHT START!",
    fontFamily: "Press Start 2P",
    styleClass: "text-[10px] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] leading-relaxed",
    badge: "Pixel Game",
  },
];

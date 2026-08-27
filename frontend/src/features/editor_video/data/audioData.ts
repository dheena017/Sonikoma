// ─── audioData ────────────────────────────────────────────────────────────────
// Canonical location: features/editor_video/data/audioData.ts
// Real royalty-free audio tracks, anime BGM streams, and combat SFX

import { AudioTrack } from "../types/workspace.types";

export const AUDIO_SUB_TABS = [
  "All",
  "Music",
  "Voice",
  "SFX",
  "Ambient",
  "Recorder",
  "AI Voice",
];

export const REAL_AUDIO_TRACKS: AudioTrack[] = [
  // ── Music / BGM Tracks (Real streaming royalty-free audio) ────────────────
  {
    id: "bgm-epic-battle",
    title: "Orchestral Boss Battle (Epic)",
    category: "music",
    duration: "2:45",
    mood: "Epic / Intense",
    genre: "Orchestral",
    badge: "140 BPM",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-hollywood-trailer-9489.mp3",
  },
  {
    id: "bgm-synthwave-cyber",
    title: "Synthwave Night Drive",
    category: "music",
    duration: "2:18",
    mood: "Cyberpunk",
    genre: "Synthwave",
    badge: "128 BPM",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30de.mp3?filename=cyberpunk-2099-10701.mp3",
  },
  {
    id: "bgm-lofi-chill",
    title: "Midnight Manga Lo-Fi Chill",
    category: "music",
    duration: "2:30",
    mood: "Relaxed",
    genre: "Lo-Fi Hip Hop",
    badge: "85 BPM",
    url: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_c89c8a9f47.mp3?filename=lofi-study-112191.mp3",
  },
  {
    id: "bgm-dark-suspense",
    title: "Shadow Dungeon Ambience",
    category: "music",
    duration: "3:04",
    mood: "Dark / Suspense",
    genre: "Dark Cinematic",
    badge: "Atmospheric",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=dark-mystery-trailer-2070.mp3",
  },

  // ── SFX Combat & Action (Real impact, slashes, explosions) ───────────────
  {
    id: "sfx-sword-slash",
    title: "Katana Blade Slash & Sheathe",
    category: "sfx",
    duration: "0:02",
    badge: "Sword FX",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_7314541578.mp3?filename=sword-sound-2-36274.mp3",
  },
  {
    id: "sfx-impact-boom",
    title: "Heavy Anime Impact Punch (POW)",
    category: "sfx",
    duration: "0:02",
    badge: "Heavy Impact",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_b201dcfa95.mp3?filename=cinematic-boom-impact-101180.mp3",
  },
  {
    id: "sfx-energy-blast",
    title: "Super Saiyan Energy Blast (Kame)",
    category: "sfx",
    duration: "0:03",
    badge: "Energy Beam",
    url: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=laser-gun-shot-sound-future-sci-fi-lazer-wobble-weapon-laser-blaster-98188.mp3",
  },
  {
    id: "sfx-whoosh-fast",
    title: "High-Speed Flash Step (Shunpo)",
    category: "sfx",
    duration: "0:01",
    badge: "Speed Whoosh",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_24a2efad6a.mp3?filename=whoosh-6316.mp3",
  },

  // ── Ambient Background Sounds ──────────────────────────────────────────
  {
    id: "amb-heavy-rain",
    title: "Tokyo Rain & Thunder (Ambient)",
    category: "ambient",
    duration: "3:45",
    badge: "Weather",
    url: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_db60b09477.mp3?filename=rain-and-thunder-16705.mp3",
  },
  {
    id: "amb-wind-mountain",
    title: "Chilly Mountain Peak Wind",
    category: "ambient",
    duration: "2:50",
    badge: "Nature",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_291122a2bf.mp3?filename=wind-howling-ambient-sound-21248.mp3",
  },

  // ── AI Voice / Dialogue Previews ─────────────────────────────────────────
  {
    id: "voice-jinwoo-battle",
    title: "Arise! (Shadow Extraction Command)",
    category: "voice",
    duration: "0:02",
    badge: "Male Voice",
  },
  {
    id: "voice-narrator-intro",
    title: "In a world where hunters awaken...",
    category: "voice",
    duration: "0:04",
    badge: "Deep Narrator",
  },
];

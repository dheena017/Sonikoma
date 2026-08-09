import { AudioTrack } from "../types/workspace.types";

export const AUDIO_SUB_TABS = [
  "Music",
  "Voice",
  "SFX",
  "Ambient",
  "Mixer",
  "Recorder",
  "AI Voice",
];

export const MOCK_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "a-1",
    title: "Synthwave Battle Neon",
    category: "music",
    duration: "2:45",
    mood: "Upbeat",
    genre: "Synthwave",
    badge: "128 BPM",
  },
  {
    id: "a-2",
    title: "Orchestral Boss Entrance",
    category: "music",
    duration: "3:10",
    mood: "Cinematic",
    genre: "Orchestral",
    badge: "Epic BGM",
  },
  {
    id: "a-3",
    title: "High Impact POW Punch",
    category: "sfx",
    duration: "0:02",
    badge: "Combat Impact",
  },
  {
    id: "a-4",
    title: "Energy Blast Swoosh",
    category: "sfx",
    duration: "0:03",
    badge: "Transition SFX",
  },
  {
    id: "a-5",
    title: "Heavy Rain & Thunder Ambient",
    category: "ambient",
    duration: "5:00",
    badge: "Environment",
  },
  {
    id: "a-6",
    title: "Dungeon Wind Whispers",
    category: "ambient",
    duration: "3:30",
    badge: "Suspense",
  },
  {
    id: "a-7",
    title: "Kokoro Neural TTS (EN Male)",
    category: "ai-voice",
    duration: "Instant",
    badge: "Neural AI",
  },
  {
    id: "a-8",
    title: "Naruto Style Voice Actor",
    category: "ai-voice",
    duration: "Instant",
    badge: "Anime Voice",
  },
];

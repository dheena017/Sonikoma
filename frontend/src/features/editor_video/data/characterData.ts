// ─── characterData ────────────────────────────────────────────────────────────
// Canonical location: features/editor_video/data/characterData.ts
// Character generation utilities with DiceBear Open Source Anime/Comic Avatar API

import { CharacterItem } from "../types/workspace.types";

export const CHARACTER_SUB_TABS = [
  "Roster",
  "Expressions",
  "Voice Cast",
  "Character Creator",
];

export const getDicebearAvatar = (seed: string, style: "adventurer" | "lorelei" | "bottts" = "adventurer") => {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const DEFAULT_PROJECT_CHARACTERS: CharacterItem[] = [
  {
    id: "char-jinwoo",
    name: "Jin-Woo (Shadow Lord)",
    role: "Protagonist",
    avatar: getDicebearAvatar("JinWooShadow", "adventurer"),
    voiceActor: "Hiroshi (Anime Protagonist)",
    badge: "Main Lead",
  },
  {
    id: "char-cha-hae",
    name: "Cha Hae-In (Swordmaster)",
    role: "Sidekick",
    avatar: getDicebearAvatar("ChaHaeIn", "lorelei"),
    voiceActor: "Aoi (Cool Heroine)",
    badge: "S-Rank Hunter",
  },
  {
    id: "char-baran",
    name: "Demon King Baran",
    role: "Antagonist",
    avatar: getDicebearAvatar("DemonBaran", "bottts"),
    voiceActor: "Kurogane (Dark Boss)",
    badge: "Monarch Boss",
  },
  {
    id: "char-system",
    name: "Systemic AI Guide",
    role: "Narrator",
    avatar: getDicebearAvatar("SystemGuideAI", "bottts"),
    voiceActor: "Narrator (Storyteller)",
    badge: "System Voice",
  },
];

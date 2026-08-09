import { CharacterItem } from "../types/workspace.types";

export const CHARACTER_SUB_TABS = [
  "Library",
  "Expressions",
  "Poses",
  "Voice",
  "Consistency",
  "AI Character",
  "Relationships",
];

export const MOCK_CHARACTERS: CharacterItem[] = [
  {
    id: "c-1",
    name: "Jin-Woo (Shadow Monarch)",
    role: "Protagonist",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
    voiceActor: "Kokoro Voice (EN Male)",
    badge: "Main Lead",
  },
  {
    id: "c-2",
    name: "Chae-In (S-Rank Hunter)",
    role: "Sidekick",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    voiceActor: "Anime Female Energetic",
    badge: "S-Rank",
  },
  {
    id: "c-3",
    name: "Demon King Baran",
    role: "Antagonist",
    avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80",
    voiceActor: "Cinematic Deep Narrator",
    badge: "Boss Enemy",
  },
  {
    id: "c-4",
    name: "System Systemic Narrator",
    role: "Narrator",
    avatar: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80",
    voiceActor: "Sci-Fi AI Assistant",
    badge: "System Voice",
  },
];

export const CHARACTER_EXPRESSIONS = [
  { id: "e-1", name: "Aggressive Battle Smile", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80" },
  { id: "e-2", name: "Shocked / Eyes Wide", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80" },
  { id: "e-3", name: "Cold Shadow Stare", img: "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80" },
  { id: "e-4", name: "Determined Grint", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&auto=format&fit=crop&q=80" },
];

export const CHARACTER_POSES = [
  { id: "p-1", title: "Dual Dagger Slash", tag: "Combat" },
  { id: "p-2", title: "Shadow Extraction Summon", tag: "Ultimate" },
  { id: "p-3", title: "Mid-Air Dodge", tag: "Evasion" },
  { id: "p-4", title: "Standing Cape Flutter", tag: "Idle Stance" },
];

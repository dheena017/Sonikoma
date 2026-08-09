import { FavoriteItem } from "../workspaces/favorites/FavoritesWorkspace";

export const FAVORITES_SUB_TABS = ["All", "Characters", "Templates", "Audio", "AI Studio"];

export const DEFAULT_FAVORITES: FavoriteItem[] = [
  {
    id: "fav-1",
    title: "Shadow Monarch Character Model",
    type: "Characters",
    workspace: "Characters",
    badge: "Protagonist",
    img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "fav-2",
    title: "Cha Hae-In Support Character",
    type: "Characters",
    workspace: "Characters",
    badge: "Sidekick",
  },
  {
    id: "fav-3",
    title: "Manhwa Split Panel Burst",
    type: "Templates",
    workspace: "Templates",
    badge: "16:9 • 0:30",
  },
  {
    id: "fav-4",
    title: "Cyberpunk Webtoon Opener",
    type: "Templates",
    workspace: "Templates",
    badge: "9:16 Scroll",
  },
  {
    id: "fav-5",
    title: "Synthwave Battle Neon BGM",
    type: "Audio",
    workspace: "Audio",
    badge: "128 BPM",
  },
  {
    id: "fav-6",
    title: "2.5D Parallax Camera Motion",
    type: "AI Studio",
    workspace: "AI Studio",
    badge: "Depth Motion",
  },
  {
    id: "fav-7",
    title: "Auto Speech Bubble Detector",
    type: "AI Studio",
    workspace: "AI Studio",
    badge: "OCR Vision",
  },
];

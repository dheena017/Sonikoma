import { MediaAsset } from "../types/workspace.types";

export const MEDIA_SUB_TABS = [
  "All",
  "Panels",
  "Images",
  "Videos",
  "Audio",
  "Generated",
  "Cloud",
  "Recent",
];

export const MOCK_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "m-1",
    title: "Panel Cut #1 - Battle Entry",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
    type: "panel",
    duration: "4s",
    badge: "Webtoon 4K",
  },
  {
    id: "m-2",
    title: "Panel Cut #2 - Sword Strike",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80",
    type: "panel",
    duration: "6s",
    badge: "Panel Cut",
  },
  {
    id: "m-3",
    title: "Cyber City Night Scene",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&auto=format&fit=crop&q=80",
    type: "video",
    duration: "12s",
    badge: "Stock 4K",
  },
  {
    id: "m-4",
    title: "Anime Character PNG Cutout",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
    type: "image",
    badge: "PNG Alpha",
  },
  {
    id: "m-5",
    title: "Epic Boss Battle BGM",
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    type: "audio",
    duration: "2:45",
    badge: "BGM WAV",
  },
  {
    id: "m-6",
    title: "AI Generated Dragon Aura",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop&q=80",
    type: "generated",
    badge: "Sonikoma AI",
  },
];

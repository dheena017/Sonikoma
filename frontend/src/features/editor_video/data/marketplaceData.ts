import { MarketplacePack } from "../types/workspace.types";

export const MARKETPLACE_SUB_TABS = [
  "Comic Packs",
  "Transition Packs",
  "Voice Packs",
  "Character Packs",
  "Template Packs",
  "Animation Packs",
  "Plugin Store",
];

export const MOCK_MARKETPLACE_PACKS: MarketplacePack[] = [
  {
    id: "mp-1",
    title: "Cyberpunk Webtoon Asset Pack",
    category: "comic-packs",
    badge: "Featured",
    price: "$9.99",
    rating: 4.9,
    downloads: "14.2k",
    img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "mp-2",
    title: "Manga Page Turn & Speedline Transitions",
    category: "transition-packs",
    badge: "Pro FX",
    price: "$4.99",
    rating: 4.8,
    downloads: "8.7k",
    img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "mp-3",
    title: "Japanese Anime Character Dub Voice Pack",
    category: "voice-packs",
    badge: "AI Voice",
    price: "Free",
    rating: 5.0,
    downloads: "28.1k",
    img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "mp-4",
    title: "Fantasy Kingdom Character Cutout Roster",
    category: "character-packs",
    badge: "PNG Pack",
    price: "$12.99",
    rating: 4.7,
    downloads: "5.4k",
    img: "https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80",
  },
];

// ─── resourceData ────────────────────────────────────────────────────────────
// Canonical location: features/editor_video/data/resourceData.ts
// Real Video Color Grading LUT Filters, Overlays, and Creator Brand Palettes

import { ResourceItem } from "../types/workspace.types";

export const RESOURCE_SUB_TABS = [
  "All",
  "LUTs",
  "Overlays",
  "Colors",
  "Fonts",
  "Logos",
];

export interface RealLutFilter {
  id: string;
  name: string;
  cssFilter: string;
  desc: string;
  badge: string;
}

export const REAL_LUT_FILTERS: RealLutFilter[] = [
  {
    id: "lut-cyberpunk",
    name: "Cyberpunk Neon 2099",
    cssFilter: "contrast(130%) saturate(160%) hue-rotate(15deg) brightness(105%)",
    desc: "Vibrant high-contrast cyan & magenta neon boost",
    badge: "Cyberpunk",
  },
  {
    id: "lut-manga-noir",
    name: "Manga Ink Noir (B&W)",
    cssFilter: "grayscale(100%) contrast(190%) brightness(95%)",
    desc: "Classic high contrast black & white printed manga tone",
    badge: "Manga Noir",
  },
  {
    id: "lut-vintage-sepia",
    name: "Vintage Sepia Paper",
    cssFilter: "sepia(75%) contrast(115%) brightness(95%) saturate(120%)",
    desc: "Warm nostalgic sepia tone with aged paper warmth",
    badge: "Sepia Tone",
  },
  {
    id: "lut-dark-fantasy",
    name: "Dark Fantasy Grim",
    cssFilter: "contrast(140%) brightness(85%) saturate(75%)",
    desc: "Desaturated moody shadow look for dark dungeons",
    badge: "Dark Fantasy",
  },
  {
    id: "lut-shonen-vibrant",
    name: "Shonen Anime Battle",
    cssFilter: "contrast(120%) saturate(150%) brightness(105%)",
    desc: "Punchy, saturated colors for daytime action battles",
    badge: "Anime Vibrant",
  },
];

export const REAL_RESOURCES: ResourceItem[] = [
  {
    id: "r-lut-cyberpunk",
    title: "Cyberpunk Neon 2099 LUT",
    category: "luts",
    detail: "contrast(130%) saturate(160%) hue-rotate(15deg)",
    badge: "Active Shader",
  },
  {
    id: "r-lut-noir",
    title: "Manga Ink Noir (B&W) LUT",
    category: "luts",
    detail: "grayscale(100%) contrast(190%)",
    badge: "High Contrast",
  },
  {
    id: "r-lut-sepia",
    title: "Vintage Sepia Paper LUT",
    category: "luts",
    detail: "sepia(75%) contrast(115%)",
    badge: "Warm Tone",
  },
  {
    id: "r-lut-dark",
    title: "Dark Fantasy Grim LUT",
    category: "luts",
    detail: "contrast(140%) brightness(85%)",
    badge: "Desaturated",
  },
  {
    id: "r-color-cyber",
    title: "Cyberpunk Hex Swatch Kit",
    category: "colors",
    detail: "#3b82f6 • #06b6d4 • #f43f5e • #f59e0b",
    hex: "#3b82f6",
    badge: "Creator Palette",
  },
  {
    id: "r-color-gold",
    title: "Gold Foil Anime Metal Swatch",
    category: "colors",
    detail: "#eab308 • #ca8a04 • #fef08a",
    hex: "#eab308",
    badge: "Metallic Swatch",
  },
  {
    id: "r-overlay-grain",
    title: "Cinematic 35mm Film Grain",
    category: "overlays",
    detail: "Simulated analog film noise texture",
    badge: "35mm Grain",
  },
  {
    id: "r-overlay-vignette",
    title: "Dramatic Dark Vignette Border",
    category: "overlays",
    detail: "Radial edge darkening for dramatic focus",
    badge: "Focus Border",
  },
];

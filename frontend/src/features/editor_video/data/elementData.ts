// ─── elementData ──────────────────────────────────────────────────────────────
// Canonical location: features/editor_video/data/elementData.ts
// Real Manga & Comic Vector SVGs for speech bubbles, action speedlines, and FX

export interface VectorElementItem {
  id: string;
  title: string;
  category: "speech-bubbles" | "speed-lines" | "manga-fx" | "screen-tones" | "comic-frames";
  badge: string;
  desc: string;
  svgType: "shout-bubble" | "oval-bubble" | "thought-cloud" | "system-box" | "radial-zoom" | "linear-speed" | "boom-sfx" | "slash-sfx" | "pow-sfx" | "halftone-dots";
}

export const ELEMENT_SUB_TABS = [
  "All",
  "Speech Bubbles",
  "Speed Lines",
  "Manga FX",
  "Screen Tones",
  "Comic Frames",
];

export const REAL_ELEMENTS: VectorElementItem[] = [
  // ── Speech Bubbles ────────────────────────────────────────────────────────
  {
    id: "elem-bubble-shout",
    title: "Manga Jagged Shout Bubble",
    category: "speech-bubbles",
    badge: "Battle Shout",
    desc: "Spiky action bubble for screams and attacks",
    svgType: "shout-bubble",
  },
  {
    id: "elem-bubble-oval",
    title: "Smooth Dialogue Bubble",
    category: "speech-bubbles",
    badge: "Standard Speech",
    desc: "Clean classic oval speech balloon",
    svgType: "oval-bubble",
  },
  {
    id: "elem-bubble-thought",
    title: "Inner Monologue Cloud",
    category: "speech-bubbles",
    badge: "Thought Bubble",
    desc: "Cloud bubbles for unspoken thoughts",
    svgType: "thought-cloud",
  },
  {
    id: "elem-box-system",
    title: "Sci-Fi System Prompt Box",
    category: "speech-bubbles",
    badge: "System UI",
    desc: "Futuristic glowing rectangular prompt box",
    svgType: "system-box",
  },

  // ── Action Speed Lines ────────────────────────────────────────────────────
  {
    id: "elem-speed-radial",
    title: "Dramatic Radial Zoom Burst",
    category: "speed-lines",
    badge: "Focus Zoom",
    desc: "High intensity radial action speedlines",
    svgType: "radial-zoom",
  },
  {
    id: "elem-speed-linear",
    title: "Horizontal Dash Speedlines",
    category: "speed-lines",
    badge: "Fast Motion",
    desc: "Directional dash lines for high speed movement",
    svgType: "linear-speed",
  },

  // ── Manga FX Onomatopoeia ────────────────────────────────────────────────
  {
    id: "elem-fx-boom",
    title: "BOOM! Explosion Comic Burst",
    category: "manga-fx",
    badge: "Explosion FX",
    desc: "Explosive impact typography sticker",
    svgType: "boom-sfx",
  },
  {
    id: "elem-fx-slash",
    title: "SLASH! Katana Sword Cut",
    category: "manga-fx",
    badge: "Blade Attack",
    desc: "Sharp blade slash impact visualizer",
    svgType: "slash-sfx",
  },
  {
    id: "elem-fx-pow",
    title: "POW! Heavy Punch Strike",
    category: "manga-fx",
    badge: "Punch Impact",
    desc: "Comic punch impact starburst sticker",
    svgType: "pow-sfx",
  },

  // ── Screen Tones ──────────────────────────────────────────────────────────
  {
    id: "elem-tone-halftone",
    title: "Manga Halftone Dot Matrix",
    category: "screen-tones",
    badge: "Dot Pattern",
    desc: "Traditional manga printed screen tone",
    svgType: "halftone-dots",
  },
];

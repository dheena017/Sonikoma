export interface DetectionOption {
  value: "all" | "white_only" | "text_only";
  label: string;
  badge: string;
  badgeColor: string;
  dot: string;
  hint: string;
}

export interface EraseOption {
  value: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  label: string;
  icon: string;
  badge: string | null;
  hint: string;
}

export interface LegendItem {
  color: string;
  label: string;
  desc: string;
}

export const DETECTION_OPTIONS: DetectionOption[] = [
  {
    value: "all",
    label: "All Bubble Types",
    badge: "Default",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dot: "bg-purple-500",
    hint: "Fires Gemini AI first, then OpenCV fallback. Catches every bubble type: white speech bubbles, colored narration boxes, and floating borderless text.",
  },
  {
    value: "white_only",
    label: "White Bubbles Only",
    badge: "Fast",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-white border border-neutral-600",
    hint: "Skips Gemini. Pure OpenCV brightness-threshold mode. Only erases classic speech / shout / thought bubbles with bright white fill. Fastest option, no API cost.",
  },
  {
    value: "text_only",
    label: "Floating Text Only",
    badge: "Targeted",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    hint: "Groups dark text letter-strokes to erase narration boxes and borderless floating text drawn directly over colored art backgrounds.",
  },
];

export const ERASE_OPTIONS: EraseOption[] = [
  {
    value: "auto",
    label: "Auto (AI-Dispatch)",
    icon: "🤖",
    badge: "Recommended",
    hint: "AI classifies each detected region (white bubble / narration box / SFX) then automatically selects the best eraser for it.",
  },
  {
    value: "inpaint",
    label: "Inpaint TELEA",
    icon: "🎨",
    badge: "Best Quality",
    hint: "Reconstructs background pixels using the TELEA inpainting algorithm. Highest visual quality for white speech bubbles.",
  },
  {
    value: "blur",
    label: "Gaussian Blur",
    icon: "🌫️",
    badge: "Soft",
    hint: "Applies a heavy Gaussian blur over the region. Preserves background tone and color. Best for colored narration boxes.",
  },
  {
    value: "solid_white",
    label: "Fill White",
    icon: "⬜",
    badge: null,
    hint: "Paints the detected bubble region with solid white pixels. Clean and simple.",
  },
  {
    value: "solid_black",
    label: "Fill Black",
    icon: "⬛",
    badge: null,
    hint: "Paints the detected bubble region with solid black pixels.",
  },
];

export const LEGEND: LegendItem[] = [
  { color: "bg-purple-500",  label: "Standard / Shout Bubbles",  desc: "White/off-white fill → OpenCV threshold → inpainted cleanly" },
  { color: "bg-orange-400",  label: "Narration Boxes",            desc: "Colored rectangles (dark/blue bg) → Gaussian blur kills text" },
  { color: "bg-sky-400",     label: "Floating Borderless Text",   desc: "Text drawn over art background → soft blur mask applied" },
  { color: "bg-red-400",     label: "SFX (BOOM / CRASH / POW)",   desc: "Embedded art-style text → kept as-is for visual feel" },
];

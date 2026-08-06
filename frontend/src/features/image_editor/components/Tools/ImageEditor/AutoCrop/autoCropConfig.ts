export interface BgModeOption {
  value: string;
  label: string;
  hint: string;
}

export interface StrategyOption {
  value: string;
  label: string;
  hint: string;
}

export interface AspectRatioOption {
  value: string;
  label: string;
  sub: string;
}

export const BG_MODE_OPTIONS: BgModeOption[] = [
  {
    value: "auto",
    label: "Auto-Detect BG",
    hint: "Automatically detect the margin boundary color based on corner/edge pixel samples.",
  },
  {
    value: "white",
    label: "Force White BG",
    hint: "Strictly treat white/off-white pixels as background gutters to trim.",
  },
  {
    value: "black",
    label: "Force Black BG",
    hint: "Strictly treat dark/black pixels as background gutters to trim.",
  },
];

export const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    value: "balanced",
    label: "Balanced",
    hint: "Optimized for speed and precision. Standard for most comics.",
  },
  {
    value: "precise",
    label: "Precise",
    hint: "Finer analysis steps. Best for complex layout borders.",
  },
  {
    value: "fast",
    label: "Fast",
    hint: "Coarser sample lines. Best for simple vertical layouts.",
  },
];

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: "free", label: "Free", sub: "No constraint" },
  { value: "9:16", label: "9:16", sub: "Mobile / Webtoon" },
  { value: "16:9", label: "16:9", sub: "Landscape HD" },
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "4:3", label: "4:3", sub: "Classic panel" },
  { value: "3:4", label: "3:4", sub: "Portrait manga" },
];

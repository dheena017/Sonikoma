export interface StoryboardPanel {
  id: string;
  index: number;
  imageUrl: string;
  motionPreset?: string;
  dialogueText: string;
  narrativeText?: string;
  sfx?: string;
  duration?: number; // in seconds
  voiceOverride?: string;
  enabled: boolean;
  isAnalyzing?: boolean;
  visualDescription?: string;
  audioUrl?: string;
  narrativeAudioUrl?: string;
  error?: string;
}

export interface VoiceOption {
  code: string;
  name?: string;
  label?: string;
  gender?: string;
  locale?: string;
}

export interface MotionPresetOption {
  id: string;
  label: string;
}

export interface BgmMoodOption {
  id: string;
  label: string;
  desc: string;
}

export const MOTION_PRESETS: MotionPresetOption[] = [
  { id: "", label: "Auto (AI Director)" },
  { id: "zoom_in", label: "Dynamic Zoom In" },
  { id: "zoom_out", label: "Wide Zoom Out" },
  { id: "pan_up", label: "Pan Up (Bottom to Top)" },
  { id: "pan_down", label: "Pan Down (Top to Bottom)" },
  { id: "pan_left", label: "Pan Left" },
  { id: "pan_right", label: "Pan Right" },
  { id: "ken_burns", label: "Ken Burns (Pan & Zoom)" },
  { id: "dolly_shake", label: "Action Dolly Shake" },
  { id: "static", label: "Static Shot" },
];

export const BGM_MOODS: BgmMoodOption[] = [
  { id: "action", label: "⚔️ Action / Battle", desc: "Heavy energetic beat" },
  { id: "drama", label: "🎭 Emotional Drama", desc: "Piano & orchestral strings" },
  { id: "chill", label: "☕ Chill / Lo-Fi", desc: "Relaxing hip-hop beats" },
  { id: "mystery", label: "🕵️ Dark Mystery", desc: "Suspenseful ambient tones" },
  { id: "epic", label: "🌌 Epic Orchestral", desc: "Triumphant choir & horns" },
  { id: "cyberpunk", label: "⚡ Cyberpunk Synth", desc: "Futuristic synthwave" },
];

export const SAMPLE_PANELS: StoryboardPanel[] = [
  {
    id: "sample-1",
    index: 1,
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    motionPreset: "zoom_in",
    dialogueText: "",
    duration: 3.5,
    enabled: true,
  },
  {
    id: "sample-2",
    index: 2,
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    motionPreset: "dolly_shake",
    dialogueText: "",
    duration: 3.0,
    enabled: true,
  },
  {
    id: "sample-3",
    index: 3,
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    motionPreset: "pan_up",
    dialogueText: "It doesn't matter what happens next. We fight together!",
    duration: 4.0,
    enabled: true,
  },
];

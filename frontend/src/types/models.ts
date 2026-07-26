export interface AIModel {
  id: string;
  name: string;
  type: "free" | "paid" | "open-source";
  provider: string;
}

export const AI_MODELS: AIModel[] = [
  // Free Google Models
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash Lite Preview",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3.0 Flash Preview",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    type: "free",
    provider: "Google",
  },
  {
    id: "gemini-1.5-flash-8b",
    name: "Gemini 1.5 Flash 8B",
    type: "free",
    provider: "Google",
  },
  {
    id: "nano-banana-pro-preview",
    name: "Nano Banana Pro Preview",
    type: "free",
    provider: "Google",
  },

  // Paid / Pro Google Models
  {
    id: "gemini-3.5-pro",
    name: "Gemini 3.5 Pro",
    type: "paid",
    provider: "Google",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    type: "paid",
    provider: "Google",
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3.0 Pro Preview",
    type: "paid",
    provider: "Google",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    type: "paid",
    provider: "Google",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    type: "paid",
    provider: "Google",
  },

  // Open Source Models
  {
    id: "gemma-4-31b-it",
    name: "Gemma 4 31B IT",
    type: "open-source",
    provider: "Google",
  },
  {
    id: "gemma-4-26b-a4b-it",
    name: "Gemma 4 26B IT",
    type: "open-source",
    provider: "Google",
  },
  {
    id: "llama-3-70b",
    name: "Llama 3 (via Groq)",
    type: "open-source",
    provider: "Groq",
  },
  {
    id: "huggingface-mistral-7b",
    name: "Mistral 7B (via HuggingFace)",
    type: "open-source",
    provider: "Hugging Face",
  },
];


export interface PanelLayers {
  background_url: string;
  character_url: string;
  text_url: string;
  bg_visible?: boolean;
  char_visible?: boolean;
  text_visible?: boolean;
  char_x?: number;
  char_y?: number;
  char_scale_x?: number;
  char_scale_y?: number;
  text_x?: number;
  text_y?: number;
  text_scale_x?: number;
  text_scale_y?: number;
  parallax_intensity?: number;
}

export interface DialogueSegment {
  ocr_index: number;
  ocr_text: string;
  whisper_text: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

export interface PanelSyncMap {
  dialogue_map: DialogueSegment[];
  audio_peaks: number[];
  peaks_fps?: number;
}

export interface GeneratedPanel {
  id: number;
  image_url: string;
  original_url?: string;
  speech_text: string;
  sfx: string;
  duration: number;
  motion_type: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grayscale?: boolean;
  filter_preset?: string;
  smart_crop?: boolean;
  crop_padding?: number;
  isAnalyzing?: boolean;
  visual_description?: string;
  bubble_sensitivity?: number;
  bubble_dilation?: number;
  inpaint_radius?: number;
  detection_style?: string;
  bubble_method?: string;
  audio_url?: string;
  layers?: PanelLayers;
  syncMap?: PanelSyncMap;
  narrative?: string;
  narrative_audio_url?: string;
  audio_reactive_shake?: boolean;
  episode_label?: string;
}

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
  avatar_url?: string;
}

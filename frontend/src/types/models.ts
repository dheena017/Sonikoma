export interface AIModel {
  id: string;
  name: string;
  type?: "free" | "paid" | "open-source";
  provider: string;
  category?: string;
  context_window?: number;
  max_output_tokens?: number;
  prompt_price_per_1m?: number;
  completion_price_per_1m?: number;
  speed_rating?: string;
  capabilities?: string[];
  recommended_for?: string[];
}

export const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Google Gemini 2.5 Flash",
    type: "paid",
    provider: "Google",
    category: "Vision & Multimodal",
    context_window: 1048576,
    max_output_tokens: 8192,
    prompt_price_per_1m: 0.075,
    completion_price_per_1m: 0.30,
    speed_rating: "Ultra Fast (<300ms)",
    capabilities: ["vision", "json_mode", "streaming", "multilingual", "function_calling"],
    recommended_for: ["YouTube SEO", "Panel Narration", "Story Scripting", "Smart Crop"],
  },
  {
    id: "gemini-2.5-pro",
    name: "Google Gemini 2.5 Pro",
    type: "paid",
    provider: "Google",
    category: "Deep Reasoning & Multimodal",
    context_window: 2097152,
    max_output_tokens: 8192,
    prompt_price_per_1m: 1.25,
    completion_price_per_1m: 5.00,
    speed_rating: "High (~800ms)",
    capabilities: ["vision", "complex_reasoning", "json_mode", "code_generation"],
    recommended_for: ["Deep Story Analysis", "Complex Panel Layout Planning"],
  },
  {
    id: "gemini-2.0-flash",
    name: "Google Gemini 2.0 Flash",
    type: "paid",
    provider: "Google",
    category: "Fast Multimodal Backup",
    context_window: 1048576,
    max_output_tokens: 8192,
    prompt_price_per_1m: 0.10,
    completion_price_per_1m: 0.40,
    speed_rating: "Ultra Fast (~250ms)",
    capabilities: ["vision", "json_mode", "streaming"],
    recommended_for: ["Panel OCR", "Bubble Text Extraction"],
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Google Gemini 2.5 Flash Lite",
    type: "paid",
    provider: "Google",
    category: "Ultra Lightweight & Fast",
    context_window: 1048576,
    max_output_tokens: 8192,
    prompt_price_per_1m: 0.0375,
    completion_price_per_1m: 0.15,
    speed_rating: "Ultra Fast (<200ms)",
    capabilities: ["vision", "speed_optimized", "json_mode"],
    recommended_for: ["High-Frequency Crop & Metadata", "Fast Background Jobs"],
  },
  {
    id: "gpt-4o",
    name: "OpenAI GPT-4o",
    type: "paid",
    provider: "OpenAI",
    category: "Omni Intelligence",
    context_window: 128000,
    max_output_tokens: 4096,
    prompt_price_per_1m: 2.50,
    completion_price_per_1m: 10.00,
    speed_rating: "Fast (~450ms)",
    capabilities: ["vision", "json_mode", "structured_outputs"],
    recommended_for: ["Nuanced Script Polishing", "Character Dialogue"],
  },
  {
    id: "gpt-4o-mini",
    name: "OpenAI GPT-4o Mini",
    type: "paid",
    provider: "OpenAI",
    category: "Fast General Intelligence",
    context_window: 128000,
    max_output_tokens: 4096,
    prompt_price_per_1m: 0.15,
    completion_price_per_1m: 0.60,
    speed_rating: "Ultra Fast (~300ms)",
    capabilities: ["json_mode", "speed_optimized"],
    recommended_for: ["High-volume metadata", "Summary Generation"],
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Anthropic Claude 3.5 Sonnet",
    type: "paid",
    provider: "Anthropic",
    category: "State-of-the-Art Reasoning",
    context_window: 200000,
    max_output_tokens: 8192,
    prompt_price_per_1m: 3.00,
    completion_price_per_1m: 15.00,
    speed_rating: "Standard (~650ms)",
    capabilities: ["creative_writing", "vision", "complex_narrative"],
    recommended_for: ["Creative Manga Dramatization", "Epic Script Writing"],
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Anthropic Claude 3.5 Haiku",
    type: "paid",
    provider: "Anthropic",
    category: "High Speed Reasoning",
    context_window: 200000,
    max_output_tokens: 8192,
    prompt_price_per_1m: 0.80,
    completion_price_per_1m: 4.00,
    speed_rating: "Ultra Fast (~280ms)",
    capabilities: ["fast_reasoning", "creative_dialogue"],
    recommended_for: ["Fast Narration Iterations"],
  },
  {
    id: "FLUX.1-schnell",
    name: "Black Forest Labs FLUX.1 Schnell",
    type: "open-source",
    provider: "Hugging Face",
    category: "Diffusion Artwork & Thumbnails",
    context_window: 512,
    max_output_tokens: 1,
    prompt_price_per_1m: 0.0,
    completion_price_per_1m: 0.0,
    speed_rating: "Fast GPU (~1.4s)",
    capabilities: ["high_res_image", "anime_fidelity", "fast_steps"],
    recommended_for: ["YouTube Thumbnail Base Artwork", "Poster Design"],
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
  prompt: string;
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
  speech_audio_url?: string;
  bgm_track?: string;
  audio_reactive_shake?: boolean;
  episode_label?: string;
  character_name?: string;
  speaker_name?: string;
}

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
  avatar_url?: string;
}

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
  speaker_gender?: "male" | "female" | "child" | "neutral" | string;
  emotion?: string;
  scene_context?: string;
  is_scene_transition?: boolean;
  is_internal_thought?: boolean;
  dialogue_turns?: DialogueTurn[];
}

export interface DialogueTurn {
  speaker_name: string;
  speaker_gender?: "male" | "female" | "child" | "neutral" | string;
  text: string;
  emotion?: string;
  audio_url?: string;
}

export interface CharacterMemory {
  gender: "male" | "female" | "child" | "neutral" | string;
  voice: string;
  is_user_locked?: boolean;
  panels_seen?: number[];
}

export interface DialogueMemoryTurn {
  panel_index: number;
  speaker: string;
  gender: string;
  emotion: string;
  text: string;
}

export interface SceneMemoryItem {
  scene: string;
  end_panel: number;
}

export interface StoryMemoryState {
  current_scene: string;
  characters: Record<string, CharacterMemory>;
  dialogue_history: DialogueMemoryTurn[];
  scene_history: SceneMemoryItem[];
  last_updated_at?: string;
}

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
  avatar_url?: string;
}

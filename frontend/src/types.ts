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
  audio_reactive_shake?: boolean;
  narrative?: string;
  narrative_audio_url?: string;
}

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
  avatar_url?: string;
}

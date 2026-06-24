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
}

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
  avatar_url?: string;
}

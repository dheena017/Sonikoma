/**
 * Centralized Settings Models, Presets, and Defaults
 * for Video Settings, Audio Settings, and Auto-Crop Settings.
 */

export interface VideoSettingsConfig {
  aspectRatio: string;
  frameRate: number;
  audioReactiveShake: boolean;
  shakeIntensity: number;
  videoFormat: "mp4" | "webm" | "gif" | "prores";
  backgroundStyle: string;
  subtitlesStyle: string;
  activeTheme: string;
}

export interface AudioSettingsConfig {
  volume: number;          // Master volume (0-100)
  narrationVolume: number; // Dialogue / TTS volume (0-100)
  bgmVolume: number;       // Music loop volume (0-100)
  sfxVolume: number;       // Impact / comic SFX volume (0-100)
  speechRate: number;      // 0.5 - 2.0
  speechPitch: number;     // -20 - +20
  voiceActor: string;      // TTS voice code
  musicTheme: string;      // Background music identifier
  audioDucking: boolean;   // Auto-duck BGM during speech
}

export interface AutoCropSettingsConfig {
  sensitivity: number;
  padding: number;
  backgroundColorMode: string;
  autoSplitTallStrips: boolean;
  aspectRatioLock: string;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  useLocalCV: boolean;
  cropModel: string;
  cropMinHeightPx: number;
  cropCannyLow: number;
  cropCannyHigh: number;
  cropCloseKernelSize: number;
}

export interface ProjectSettingsBundle {
  video_settings: VideoSettingsConfig;
  audio_settings: AudioSettingsConfig;
  autocrop_settings: AutoCropSettingsConfig;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettingsConfig = {
  aspectRatio: "16:9",
  frameRate: 30,
  audioReactiveShake: true,
  shakeIntensity: 1.0,
  videoFormat: "mp4",
  backgroundStyle: "blur-vignette",
  subtitlesStyle: "comic-bold",
  activeTheme: "obsidian",
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettingsConfig = {
  volume: 80,
  narrationVolume: 90,
  bgmVolume: 50,
  sfxVolume: 85,
  speechRate: 1.0,
  speechPitch: 0.0,
  voiceActor: "en-US-ChristopherNeural",
  musicTheme: "orchestral_battle",
  audioDucking: true,
};

export const DEFAULT_AUTOCROP_SETTINGS: AutoCropSettingsConfig = {
  sensitivity: 40,
  padding: 12,
  backgroundColorMode: "auto",
  autoSplitTallStrips: true,
  aspectRatioLock: "free",
  minPanelAreaPct: 2.0,
  overlapMergeThreshold: 0.15,
  useLocalCV: true,
  cropModel: "yolo-v8-manga",
  cropMinHeightPx: 120,
  cropCannyLow: 30,
  cropCannyHigh: 100,
  cropCloseKernelSize: 5,
};

export const MUSIC_THEMES_CATALOG = [
  { id: "orchestral_battle", label: "Orchestral Battle Theme", icon: "⚔️", mood: "Epic" },
  { id: "mysterious_ambience", label: "Mysterious Ambience", icon: "🌫️", mood: "Tense" },
  { id: "scifi_synth", label: "Sci-Fi Synth Wave", icon: "🚀", mood: "Futuristic" },
  { id: "calm_acoustic", label: "Calm Acoustic Melancholy", icon: "🎸", mood: "Emotional" },
  { id: "no_music", label: "No Music (Dialogue Only)", icon: "🔇", mood: "Silent" },
];

export const ASPECT_RATIOS_OPTIONS = [
  { label: "16:9 (Landscape)", value: "16:9" },
  { label: "9:16 (Shorts / Reel)", value: "9:16" },
  { label: "1:1 (Square)", value: "1:1" },
  { label: "4:5 (Portrait)", value: "4:5" },
  { label: "21:9 (Cinematic)", value: "21:9" },
];

export interface TTSVoiceOption {
  code: string;
  label: string;
  gender?: "Male" | "Female";
  lang?: string;
}

export const DEFAULT_TTS_VOICES: TTSVoiceOption[] = [
  { code: "en-US-GuyNeural", label: "English (US) — Guy (Male)", gender: "Male", lang: "English" },
  { code: "en-US-JennyNeural", label: "English (US) — Jenny (Female)", gender: "Female", lang: "English" },
  { code: "en-US-AriaNeural", label: "English (US) — Aria (Female)", gender: "Female", lang: "English" },
  { code: "en-GB-SoniaNeural", label: "English (UK) — Sonia (Female)", gender: "Female", lang: "English" },
  { code: "en-US-TonyNeural", label: "English (US) — Tony (Male)", gender: "Male", lang: "English" },
  { code: "en-GB-RyanNeural", label: "English (UK) — Ryan (Male)", gender: "Male", lang: "English" },
  { code: "en-AU-NatashaNeural", label: "English (AU) — Natasha (Female)", gender: "Female", lang: "English" },
  { code: "ko-KR-SunHiNeural", label: "Korean — SunHi (Female)", gender: "Female", lang: "Korean" },
  { code: "ko-KR-InJoonNeural", label: "Korean — InJoon (Male)", gender: "Male", lang: "Korean" },
  { code: "ja-JP-NanamiNeural", label: "Japanese — Nanami (Female)", gender: "Female", lang: "Japanese" },
  { code: "ja-JP-KeitaNeural", label: "Japanese — Keita (Male)", gender: "Male", lang: "Japanese" },
  { code: "zh-CN-XiaoxiaoNeural", label: "Chinese (Mandarin) — Xiaoxiao (Female)", gender: "Female", lang: "Chinese" },
  { code: "zh-CN-YunxiNeural", label: "Chinese (Mandarin) — Yunxi (Male)", gender: "Male", lang: "Chinese" },
  { code: "ta-IN-PallaviNeural", label: "Tamil (India) — Pallavi (Female)", gender: "Female", lang: "Tamil" },
  { code: "ta-IN-ValluvarNeural", label: "Tamil (India) — Valluvar (Male)", gender: "Male", lang: "Tamil" },
  { code: "en-US-ChristopherNeural", label: "English (US) — Christopher (Male)", gender: "Male", lang: "English" },
];

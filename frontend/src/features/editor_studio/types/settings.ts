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
  // English
  { code: "en-US-GuyNeural", label: "English (US) — Guy (Male)", gender: "Male", lang: "English" },
  { code: "en-US-JennyNeural", label: "English (US) — Jenny (Female)", gender: "Female", lang: "English" },
  { code: "en-US-AriaNeural", label: "English (US) — Aria (Female)", gender: "Female", lang: "English" },
  { code: "en-US-ChristopherNeural", label: "English (US) — Christopher (Male)", gender: "Male", lang: "English" },
  { code: "en-GB-SoniaNeural", label: "English (UK) — Sonia (Female)", gender: "Female", lang: "English" },
  { code: "en-GB-RyanNeural", label: "English (UK) — Ryan (Male)", gender: "Male", lang: "English" },
  { code: "en-AU-NatashaNeural", label: "English (AU) — Natasha (Female)", gender: "Female", lang: "English" },
  { code: "en-IN-PrabhatNeural", label: "English (India) — Prabhat (Male)", gender: "Male", lang: "English" },
  { code: "en-IN-NeerjaNeural", label: "English (India) — Neerja (Female)", gender: "Female", lang: "English" },

  // Japanese
  { code: "ja-JP-NanamiNeural", label: "Japanese — Nanami (Female)", gender: "Female", lang: "Japanese" },
  { code: "ja-JP-KeitaNeural", label: "Japanese — Keita (Male)", gender: "Male", lang: "Japanese" },
  { code: "ja-JP-AoiNeural", label: "Japanese — Aoi (Female)", gender: "Female", lang: "Japanese" },
  { code: "ja-JP-DaichiNeural", label: "Japanese — Daichi (Male)", gender: "Male", lang: "Japanese" },

  // Korean
  { code: "ko-KR-SunHiNeural", label: "Korean — SunHi (Female)", gender: "Female", lang: "Korean" },
  { code: "ko-KR-InJoonNeural", label: "Korean — InJoon (Male)", gender: "Male", lang: "Korean" },
  { code: "ko-KR-BongJinNeural", label: "Korean — BongJin (Male)", gender: "Male", lang: "Korean" },
  { code: "ko-KR-YuJinNeural", label: "Korean — YuJin (Female)", gender: "Female", lang: "Korean" },

  // Spanish
  { code: "es-ES-AlvaroNeural", label: "Spanish (Spain) — Alvaro (Male)", gender: "Male", lang: "Spanish" },
  { code: "es-ES-ElviraNeural", label: "Spanish (Spain) — Elvira (Female)", gender: "Female", lang: "Spanish" },
  { code: "es-MX-DaliaNeural", label: "Spanish (Mexico) — Dalia (Female)", gender: "Female", lang: "Spanish" },
  { code: "es-MX-JorgeNeural", label: "Spanish (Mexico) — Jorge (Male)", gender: "Male", lang: "Spanish" },

  // French
  { code: "fr-FR-HenriNeural", label: "French (France) — Henri (Male)", gender: "Male", lang: "French" },
  { code: "fr-FR-DeniseNeural", label: "French (France) — Denise (Female)", gender: "Female", lang: "French" },
  { code: "fr-CA-SylvieNeural", label: "French (Canada) — Sylvie (Female)", gender: "Female", lang: "French" },

  // German
  { code: "de-DE-ConradNeural", label: "German — Conrad (Male)", gender: "Male", lang: "German" },
  { code: "de-DE-KatjaNeural", label: "German — Katja (Female)", gender: "Female", lang: "German" },
  { code: "de-DE-AmalaNeural", label: "German — Amala (Female)", gender: "Female", lang: "German" },

  // Chinese
  { code: "zh-CN-XiaoxiaoNeural", label: "Chinese (Mandarin) — Xiaoxiao (Female)", gender: "Female", lang: "Chinese" },
  { code: "zh-CN-YunxiNeural", label: "Chinese (Mandarin) — Yunxi (Male)", gender: "Male", lang: "Chinese" },
  { code: "zh-CN-YunjianNeural", label: "Chinese (Mandarin) — Yunjian (Male)", gender: "Male", lang: "Chinese" },
  { code: "zh-HK-HiuMaanNeural", label: "Chinese (Cantonese) — HiuMaan (Female)", gender: "Female", lang: "Chinese" },

  // Tamil (India, Sri Lanka, Singapore, Malaysia)
  { code: "ta-IN-PallaviNeural", label: "Tamil (India) — Pallavi (Female)", gender: "Female", lang: "Tamil" },
  { code: "ta-IN-ValluvarNeural", label: "Tamil (India) — Valluvar (Male)", gender: "Male", lang: "Tamil" },
  { code: "ta-LK-SaranyaNeural", label: "Tamil (Sri Lanka) — Saranya (Female)", gender: "Female", lang: "Tamil" },
  { code: "ta-LK-KumarNeural", label: "Tamil (Sri Lanka) — Kumar (Male)", gender: "Male", lang: "Tamil" },
  { code: "ta-SG-VenbaNeural", label: "Tamil (Singapore) — Venba (Female)", gender: "Female", lang: "Tamil" },
  { code: "ta-SG-AnbuNeural", label: "Tamil (Singapore) — Anbu (Male)", gender: "Male", lang: "Tamil" },
  { code: "ta-MY-KaniNeural", label: "Tamil (Malaysia) — Kani (Female)", gender: "Female", lang: "Tamil" },
  { code: "ta-MY-SuryaNeural", label: "Tamil (Malaysia) — Surya (Male)", gender: "Male", lang: "Tamil" },

  // Hindi & Indian Languages
  { code: "hi-IN-MadhurNeural", label: "Hindi (India) — Madhur (Male)", gender: "Male", lang: "Hindi" },
  { code: "hi-IN-SwaraNeural", label: "Hindi (India) — Swara (Female)", gender: "Female", lang: "Hindi" },
  { code: "te-IN-MohanNeural", label: "Telugu (India) — Mohan (Male)", gender: "Male", lang: "Telugu" },
  { code: "kn-IN-GaganNeural", label: "Kannada (India) — Gagan (Male)", gender: "Male", lang: "Kannada" },
  { code: "ml-IN-MidhunNeural", label: "Malayalam (India) — Midhun (Male)", gender: "Male", lang: "Malayalam" },

  // Portuguese
  { code: "pt-BR-AntonioNeural", label: "Portuguese (Brazil) — Antonio (Male)", gender: "Male", lang: "Portuguese" },
  { code: "pt-BR-FranciscaNeural", label: "Portuguese (Brazil) — Francisca (Female)", gender: "Female", lang: "Portuguese" },
  { code: "pt-PT-DuarteNeural", label: "Portuguese (Portugal) — Duarte (Male)", gender: "Male", lang: "Portuguese" },

  // Italian
  { code: "it-IT-DiegoNeural", label: "Italian — Diego (Male)", gender: "Male", lang: "Italian" },
  { code: "it-IT-ElsaNeural", label: "Italian — Elsa (Female)", gender: "Female", lang: "Italian" },

  // Indonesian & Southeast Asian
  { code: "id-ID-ArdiNeural", label: "Indonesian — Ardi (Male)", gender: "Male", lang: "Indonesian" },
  { code: "id-ID-GadisNeural", label: "Indonesian — Gadis (Female)", gender: "Female", lang: "Indonesian" },
  { code: "vi-VN-NamMinhNeural", label: "Vietnamese — NamMinh (Male)", gender: "Male", lang: "Vietnamese" },
  { code: "vi-VN-HoaiMyNeural", label: "Vietnamese — HoaiMy (Female)", gender: "Female", lang: "Vietnamese" },
  { code: "th-TH-NiwatNeural", label: "Thai — Niwat (Male)", gender: "Male", lang: "Thai" },
  { code: "fil-PH-AngeloNeural", label: "Filipino — Angelo (Male)", gender: "Male", lang: "Filipino" },

  // Arabic & Russian
  { code: "ar-SA-HamedNeural", label: "Arabic (Saudi) — Hamed (Male)", gender: "Male", lang: "Arabic" },
  { code: "ar-SA-ZariyahNeural", label: "Arabic (Saudi) — Zariyah (Female)", gender: "Female", lang: "Arabic" },
  { code: "ru-RU-DmitryNeural", label: "Russian — Dmitry (Male)", gender: "Male", lang: "Russian" },
  { code: "ru-RU-SvetlanaNeural", label: "Russian — Svetlana (Female)", gender: "Female", lang: "Russian" },
];

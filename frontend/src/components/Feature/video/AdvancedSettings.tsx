import React from "react";
import {
  Mic2,
  Music,
  Tv,
  Sliders,
  Palette,
  Save,
  Share2,
  Copy,
  Trash2,
  Video,
  Sparkles,
  Subtitles,
  Paintbrush,
  Disc,
  Scissors,
  MessageSquare,
  Sparkle,
} from "lucide-react";

interface AdvancedSettingsProps {
  voiceActor: string;
  setVoiceActor: (val: string) => void;
  musicTheme: string;
  setMusicTheme: (val: string) => void;
  aspectRatio: "auto" | "9:16" | "16:9";
  setAspectRatio: (val: "auto" | "9:16" | "16:9") => void;
  frameRate: number;
  setFrameRate: (val: number) => void;
  activeTheme: string;
  setActiveTheme: (val: string) => void;
  targetUrl?: string;
  selectedModel?: string;
  selectedSource?: string;
  addNotification?: (
    msg: string,
    type: "success" | "info" | "warning" | "error"
  ) => void;
  fetchWithInterceptor?: any;

  // Dynamic AI Crop settings
  cropSensitivity?: number;
  setCropSensitivity?: (val: number) => void;
  cropPaddingPx?: number;
  setCropPaddingPx?: (val: number) => void;
  cropFocusMode?: string;
  setCropFocusMode?: (val: string) => void;
  cropModel?: string;
  setCropModel?: (val: string) => void;

  // Dynamic Speech Bubble settings
  bubbleSensitivity?: number;
  setBubbleSensitivity?: (val: number) => void;
  bubbleDilation?: number;
  setBubbleDilation?: (val: number) => void;
  bubbleEraseMethod?: string;
  setBubbleEraseMethod?: (val: string) => void;
  bubbleDetectionStyle?: string;
  setBubbleDetectionStyle?: (val: string) => void;
}

interface WorkspacePreset {
  name: string;
  voiceActor: string;
  musicTheme: string;
  aspectRatio: "auto" | "9:16" | "16:9";
  frameRate: number;
  activeTheme: string;
  audioReactiveShake?: boolean;
  shakeIntensity?: "low" | "medium" | "high" | "extreme";
  videoFormat?: "mp4" | "webm" | "mkv";
  backgroundStyle?: "black" | "white" | "transparent" | "blurred";
  subtitlesStyle?: "none" | "burn-in" | "soft";

  // AI states
  cropSensitivity?: number;
  cropPaddingPx?: number;
  cropFocusMode?: string;
  cropModel?: string;
  bubbleSensitivity?: number;
  bubbleDilation?: number;
  bubbleEraseMethod?: string;
  bubbleDetectionStyle?: string;
}

const AdvancedSettings = React.memo(
  ({
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    frameRate,
    setFrameRate,
    activeTheme,
    setActiveTheme,
    targetUrl = "",
    selectedModel = "",
    selectedSource = "",
    addNotification,
    fetchWithInterceptor,

    // AI Crop Props (with local fallback if unpassed)
    cropSensitivity = 30,
    setCropSensitivity,
    cropPaddingPx = 10,
    setCropPaddingPx,
    cropFocusMode = "standard",
    setCropFocusMode,
    cropModel = "gemini-2.0-flash-lite",
    setCropModel,

    // Speech Bubble Props (with local fallback if unpassed)
    bubbleSensitivity = 50,
    setBubbleSensitivity,
    bubbleDilation = 5,
    setBubbleDilation,
    bubbleEraseMethod = "telea",
    setBubbleEraseMethod,
    bubbleDetectionStyle = "hybrid",
    setBubbleDetectionStyle,
  }: AdvancedSettingsProps) => {
    const [presetName, setPresetName] = React.useState("");

    // Dynamic Voices Loader
    const [availableVoices, setAvailableVoices] = React.useState<Array<{ code: string; label: string }>>([]);
    const [loadingVoices, setLoadingVoices] = React.useState(false);

    React.useEffect(() => {
      let active = true;
      const loadVoices = async () => {
        setLoadingVoices(true);
        try {
          const fetchFn = fetchWithInterceptor || window.fetch.bind(window);
          const res = await fetchFn("/api/audio/voices");
          const data = await res.json();
          if (active && data?.success && data?.voices) {
            setAvailableVoices(data.voices);
          }
        } catch (e) {
          console.error("Failed to load dynamic voices:", e);
        } finally {
          if (active) setLoadingVoices(false);
        }
      };
      loadVoices();
      return () => {
        active = false;
      };
    }, [fetchWithInterceptor]);

    const defaultVoices = [
      { code: "Standard Comic Narrator (Male)", label: "Standard Comic Narrator (Male)" },
      { code: "Sultry Narrative Tone (Female)", label: "Sultry Narrative Tone (Female)" },
      { code: "Shonen Protagonist (Energetic Male)", label: "Shonen Protagonist (Energetic Male)" },
      { code: "Dark Anti-Hero voice (Raspy Deep)", label: "Dark Anti-Hero voice (Raspy Deep)" },
    ];

    const displayVoices = availableVoices.length > 0 ? availableVoices : defaultVoices;

    // Advanced Video/Rendering states
    const [audioReactiveShake, setAudioReactiveShake] = React.useState<boolean>(() => {
      return localStorage.getItem("ai_video_shake") === "true";
    });
    const [shakeIntensity, setShakeIntensity] = React.useState<"low" | "medium" | "high" | "extreme">(() => {
      return (localStorage.getItem("ai_video_shake_intensity") as any) || "medium";
    });
    const [videoFormat, setVideoFormat] = React.useState<"mp4" | "webm" | "mkv">(() => {
      return (localStorage.getItem("ai_video_format") as any) || "mp4";
    });
    const [backgroundStyle, setBackgroundStyle] = React.useState<"black" | "white" | "transparent" | "blurred">(() => {
      return (localStorage.getItem("ai_video_bg_style") as any) || "black";
    });
    const [subtitlesStyle, setSubtitlesStyle] = React.useState<"none" | "burn-in" | "soft">(() => {
      return (localStorage.getItem("ai_video_subtitles_style") as any) || "none";
    });

    React.useEffect(() => {
      localStorage.setItem("ai_video_shake", String(audioReactiveShake));
    }, [audioReactiveShake]);

    React.useEffect(() => {
      localStorage.setItem("ai_video_shake_intensity", shakeIntensity);
    }, [shakeIntensity]);

    React.useEffect(() => {
      localStorage.setItem("ai_video_format", videoFormat);
    }, [videoFormat]);

    React.useEffect(() => {
      localStorage.setItem("ai_video_bg_style", backgroundStyle);
    }, [backgroundStyle]);

    React.useEffect(() => {
      localStorage.setItem("ai_video_subtitles_style", subtitlesStyle);
    }, [subtitlesStyle]);

    // Local states fallback if callbacks are not provided
    const [localCropSensitivity, setLocalCropSensitivity] = React.useState(
      () => parseInt(localStorage.getItem("ai_crop_sensitivity") || String(cropSensitivity), 10)
    );
    const [localCropPaddingPx, setLocalCropPaddingPx] = React.useState(
      () => parseInt(localStorage.getItem("ai_crop_padding") || String(cropPaddingPx), 10)
    );
    const [localCropFocusMode, setLocalCropFocusMode] = React.useState<string>(
      () => localStorage.getItem("ai_crop_focus_mode") || cropFocusMode
    );
    const [localCropModel, setLocalCropModel] = React.useState<string>(
      () => localStorage.getItem("ai_crop_model") || cropModel
    );

    const [localBubbleSensitivity, setLocalBubbleSensitivity] = React.useState(bubbleSensitivity);
    const [localBubbleDilation, setLocalBubbleDilation] = React.useState(bubbleDilation > 0 ? bubbleDilation : 5);
    const [localBubbleEraseMethod, setLocalBubbleEraseMethod] = React.useState<string>(
      () => localStorage.getItem("ai_bubble_erase_method") || bubbleEraseMethod
    );
    const [localBubbleDetectionStyle, setLocalBubbleDetectionStyle] = React.useState<string>(
      () => localStorage.getItem("ai_bubble_detection_style") || bubbleDetectionStyle
    );

    // Persist AI Crop settings to localStorage
    React.useEffect(() => {
      localStorage.setItem("ai_crop_sensitivity", String(localCropSensitivity));
    }, [localCropSensitivity]);

    React.useEffect(() => {
      localStorage.setItem("ai_crop_padding", String(localCropPaddingPx));
    }, [localCropPaddingPx]);

    React.useEffect(() => {
      localStorage.setItem("ai_crop_focus_mode", localCropFocusMode);
    }, [localCropFocusMode]);

    React.useEffect(() => {
      localStorage.setItem("ai_crop_model", localCropModel);
    }, [localCropModel]);

    // Persist Bubble settings to localStorage
    React.useEffect(() => {
      localStorage.setItem("ai_bubble_sensitivity", String(localBubbleSensitivity));
    }, [localBubbleSensitivity]);

    React.useEffect(() => {
      localStorage.setItem("ai_bubble_dilation", String(localBubbleDilation));
    }, [localBubbleDilation]);

    React.useEffect(() => {
      localStorage.setItem("ai_bubble_erase_method", localBubbleEraseMethod);
    }, [localBubbleEraseMethod]);

    React.useEffect(() => {
      localStorage.setItem("ai_bubble_detection_style", localBubbleDetectionStyle);
    }, [localBubbleDetectionStyle]);



    // Sync state changes back to parent setters if they exist
    const handleCropSensitivityChange = (val: number) => {
      setLocalCropSensitivity(val);
      setCropSensitivity?.(val);
    };
    const handleCropPaddingChange = (val: number) => {
      setLocalCropPaddingPx(val);
      setCropPaddingPx?.(val);
    };
    const handleCropFocusChange = (val: string) => {
      setLocalCropFocusMode(val);
      setCropFocusMode?.(val);
    };
    const handleCropModelChange = (val: string) => {
      setLocalCropModel(val);
      setCropModel?.(val);
    };

    const handleBubbleSensitivityChange = (val: number) => {
      setLocalBubbleSensitivity(val);
      setBubbleSensitivity?.(val);
    };
    const handleBubbleDilationChange = (val: number) => {
      setLocalBubbleDilation(val);
      setBubbleDilation?.(val);
    };
    const handleBubbleEraseChange = (val: string) => {
      setLocalBubbleEraseMethod(val);
      setBubbleEraseMethod?.(val);
    };
    const handleBubbleDetectionChange = (val: string) => {
      setLocalBubbleDetectionStyle(val);
      setBubbleDetectionStyle?.(val);
    };

    const [presets, setPresets] = React.useState<WorkspacePreset[]>(() => {
      try {
        const stored = localStorage.getItem("ai_comic_presets");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
      return [
        {
          name: "Action Comic Preset",
          voiceActor: "Shonen Protagonist (Energetic Male)",
          musicTheme: "Orchestral Battle Theme",
          aspectRatio: "16:9",
          frameRate: 30,
          activeTheme: "cyberpunk",
          audioReactiveShake: true,
          shakeIntensity: "high",
          videoFormat: "mp4",
          backgroundStyle: "black",
          subtitlesStyle: "burn-in",
          cropSensitivity: 30,
          cropPaddingPx: 10,
          cropFocusMode: "standard",
          cropModel: "gemini-2.0-flash-lite",
          bubbleSensitivity: 50,
          bubbleDilation: 5,
          bubbleEraseMethod: "telea",
          bubbleDetectionStyle: "hybrid",
        },
        {
          name: "B&W Manga Preset",
          voiceActor: "Standard Comic Narrator (Male)",
          musicTheme: "Mysterious Ambience",
          aspectRatio: "9:16",
          frameRate: 24,
          activeTheme: "obsidian",
          audioReactiveShake: false,
          shakeIntensity: "medium",
          videoFormat: "mp4",
          backgroundStyle: "white",
          subtitlesStyle: "none",
          cropSensitivity: 40,
          cropPaddingPx: 15,
          cropFocusMode: "face",
          cropModel: "local-opencv",
          bubbleSensitivity: 60,
          bubbleDilation: 3,
          bubbleEraseMethod: "ns",
          bubbleDetectionStyle: "yolo",
        },
      ];
    });

    const handleSavePreset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!presetName.trim()) return;

      const newPreset: WorkspacePreset = {
        name: presetName.trim(),
        voiceActor,
        musicTheme,
        aspectRatio,
        frameRate,
        activeTheme,
        audioReactiveShake,
        shakeIntensity,
        videoFormat,
        backgroundStyle,
        subtitlesStyle,
        cropSensitivity: localCropSensitivity,
        cropPaddingPx: localCropPaddingPx,
        cropFocusMode: localCropFocusMode,
        cropModel: localCropModel,
        bubbleSensitivity: localBubbleSensitivity,
        bubbleDilation: localBubbleDilation,
        bubbleEraseMethod: localBubbleEraseMethod,
        bubbleDetectionStyle: localBubbleDetectionStyle,
      };

      const updatedPresets = [
        ...presets.filter((p) => p.name !== newPreset.name),
        newPreset,
      ];
      setPresets(updatedPresets);
      localStorage.setItem("ai_comic_presets", JSON.stringify(updatedPresets));
      setPresetName("");
      if (addNotification) {
        addNotification(
          `Preset "${newPreset.name}" saved successfully!`,
          "success"
        );
      }
    };

    const handleLoadPreset = (name: string) => {
      const preset = presets.find((p) => p.name === name);
      if (!preset) return;

      setVoiceActor(preset.voiceActor);
      setMusicTheme(preset.musicTheme);
      setAspectRatio(preset.aspectRatio);
      setFrameRate(preset.frameRate);
      setActiveTheme(preset.activeTheme);

      if (preset.audioReactiveShake !== undefined) setAudioReactiveShake(preset.audioReactiveShake);
      if (preset.shakeIntensity !== undefined) setShakeIntensity(preset.shakeIntensity);
      if (preset.videoFormat !== undefined) setVideoFormat(preset.videoFormat);
      if (preset.backgroundStyle !== undefined) setBackgroundStyle(preset.backgroundStyle);
      if (preset.subtitlesStyle !== undefined) setSubtitlesStyle(preset.subtitlesStyle);

      if (preset.cropSensitivity !== undefined) handleCropSensitivityChange(preset.cropSensitivity);
      if (preset.cropPaddingPx !== undefined) handleCropPaddingChange(preset.cropPaddingPx);
      if (preset.cropFocusMode !== undefined) handleCropFocusChange(preset.cropFocusMode);
      if (preset.cropModel !== undefined) handleCropModelChange(preset.cropModel);

      if (preset.bubbleSensitivity !== undefined) handleBubbleSensitivityChange(preset.bubbleSensitivity);
      if (preset.bubbleDilation !== undefined) handleBubbleDilationChange(preset.bubbleDilation);
      if (preset.bubbleEraseMethod !== undefined) handleBubbleEraseChange(preset.bubbleEraseMethod);
      if (preset.bubbleDetectionStyle !== undefined) handleBubbleDetectionChange(preset.bubbleDetectionStyle);

      if (addNotification) {
        addNotification(`Loaded preset "${name}"`, "info");
      }
    };

    const handleDeletePreset = (name: string) => {
      const updated = presets.filter((p) => p.name !== name);
      setPresets(updated);
      localStorage.setItem("ai_comic_presets", JSON.stringify(updated));
      if (addNotification) {
        addNotification(`Deleted preset "${name}"`, "info");
      }
    };

    const handleCopyShareLink = () => {
      try {
        const stateObj = {
          url: targetUrl,
          voice: voiceActor,
          music: musicTheme,
          aspectRatio,
          fps: frameRate,
          model: selectedModel,
          source: selectedSource,
          audioReactiveShake,
          shakeIntensity,
          videoFormat,
          backgroundStyle,
          subtitlesStyle,
          cropSensitivity: localCropSensitivity,
          cropPaddingPx: localCropPaddingPx,
          cropFocusMode: localCropFocusMode,
          cropModel: localCropModel,
          bubbleSensitivity: localBubbleSensitivity,
          bubbleDilation: localBubbleDilation,
          bubbleEraseMethod: localBubbleEraseMethod,
          bubbleDetectionStyle: localBubbleDetectionStyle,
        };
        const hash = btoa(JSON.stringify(stateObj));
        const shareUrl = `${window.location.origin}${window.location.pathname}?state=${hash}`;
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            if (addNotification) {
              addNotification(
                "Workspace session link copied to clipboard!",
                "success"
              );
            }
          })
          .catch(() => {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            if (addNotification) {
              addNotification(
                "Workspace session link copied to clipboard! (fallback)",
                "success"
              );
            }
          });
      } catch (e) {
        console.error("Failed to generate share link:", e);
        if (addNotification) {
          addNotification("Failed to generate share link.", "error");
        }
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Compile & Video Composition Parameters */}
        <div className="space-y-6">
          {/* Card 1: Compile Specifications */}
          <div
            id="settings_panel_card"
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Sliders className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Advanced Render Compile Specifications
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Customize layout aspect ratios and visual output frame rates
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Tv className="h-3.5 w-3.5 text-purple-400" />
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAspectRatio("auto")}
                    className={`py-1.5 px-2 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      aspectRatio === "auto" || !aspectRatio
                        ? "bg-purple-950/20 border-purple-500 text-purple-300 shadow-inner"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Auto-Detect
                  </button>
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-1.5 px-2 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      aspectRatio === "9:16"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300 shadow-inner"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    9:16 Portrait
                  </button>
                  <button
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-1.5 px-2 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      aspectRatio === "16:9"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300 shadow-inner"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    16:9 Landscape
                  </button>
                </div>
              </div>

              {/* FPS option */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  Frame Rate (FPS)
                </label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <input
                    type="range"
                    min={12}
                    max={60}
                    step={6}
                    value={frameRate}
                    onChange={(e) => setFrameRate(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#dcdcdc] shrink-0 font-semibold">
                    {frameRate} FPS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Video Composition & Audio Sync Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Video className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Video Composition & Audio Sync Settings
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Configure real-time camera motion and file encoding codecs
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Audio Reactive Camera Shake */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    Audio-Reactive Camera Shake
                  </label>
                  <button
                    onClick={() => setAudioReactiveShake(!audioReactiveShake)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      audioReactiveShake ? "bg-purple-600" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        audioReactiveShake ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {audioReactiveShake && (
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {(["low", "medium", "high", "extreme"] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setShakeIntensity(intensity)}
                        className={`py-1 rounded-lg border text-[10px] uppercase font-bold font-mono text-center transition-all cursor-pointer ${
                          shakeIntensity === intensity
                            ? "bg-purple-950/40 border-purple-500 text-purple-300"
                            : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Format Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Disc className="h-3.5 w-3.5 text-purple-400" />
                  Output Video Codec Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "mp4", label: "MP4 (H.264)" },
                    { id: "webm", label: "WebM (VP9)" },
                    { id: "mkv", label: "MKV (HEVC)" },
                  ].map((formatItem) => (
                    <button
                      key={formatItem.id}
                      onClick={() => setVideoFormat(formatItem.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-[10px] text-center font-bold font-mono transition-all cursor-pointer ${
                        videoFormat === formatItem.id
                          ? "bg-purple-950/20 border-purple-500 text-purple-300"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {formatItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Fill */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Paintbrush className="h-3.5 w-3.5 text-purple-400" />
                  Background Letterbox Fill Style
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "black", label: "Black" },
                    { id: "white", label: "White" },
                    { id: "transparent", label: "Clear" },
                    { id: "blurred", label: "Blur" },
                  ].map((bgStyle) => (
                    <button
                      key={bgStyle.id}
                      onClick={() => setBackgroundStyle(bgStyle.id as any)}
                      className={`py-1 rounded-lg border text-[10px] text-center font-bold font-mono transition-all cursor-pointer ${
                        backgroundStyle === bgStyle.id
                          ? "bg-purple-950/20 border-purple-500 text-purple-300"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {bgStyle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bake Subtitles Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Subtitles className="h-3.5 w-3.5 text-purple-400" />
                  Bake Subtitles / Captions Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "none", label: "No Subtitles" },
                    { id: "burn-in", label: "Burn-in (Bake)" },
                    { id: "soft", label: "Soft Captions" },
                  ].map((subStyle) => (
                    <button
                      key={subStyle.id}
                      onClick={() => setSubtitlesStyle(subStyle.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-[10px] text-center font-bold font-mono transition-all cursor-pointer ${
                        subtitlesStyle === subStyle.id
                          ? "bg-purple-950/20 border-purple-500 text-purple-300"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {subStyle.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Smart Crop, Bubble settings, and Preset management */}
        <div className="space-y-6">
          {/* Card 3: AI Panel Segmentation & Smart Crop Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Scissors className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  AI Panel Segmentation & Smart Crop Settings
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Fine-tune automated panel boundary detection and visual reframing focus
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Crop Sensitivity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  Panel Edge Detection Sensitivity
                </label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={localCropSensitivity}
                    onChange={(e) => handleCropSensitivityChange(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#dcdcdc] shrink-0 font-semibold w-10 text-right">
                    {localCropSensitivity}%
                  </span>
                </div>
              </div>

              {/* Crop Padding */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  Safety Padding Margin (pixels)
                </label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={2}
                    value={localCropPaddingPx}
                    onChange={(e) => handleCropPaddingChange(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#dcdcdc] shrink-0 font-semibold w-10 text-right">
                    {localCropPaddingPx}px
                  </span>
                </div>
              </div>

              {/* Crop Focus Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Tv className="h-3.5 w-3.5 text-purple-400" />
                  Smart Crop Framing Focus Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "standard", label: "Standard" },
                    { id: "tight", label: "Tight Fit" },
                    { id: "face", label: "Face Zoom" },
                  ].map((modeItem) => (
                    <button
                      key={modeItem.id}
                      onClick={() => handleCropFocusChange(modeItem.id)}
                      className={`py-1.5 px-1 rounded-xl border text-[10px] text-center font-bold font-mono transition-all cursor-pointer ${
                        localCropFocusMode === modeItem.id
                          ? "bg-purple-950/20 border-purple-500 text-purple-300"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {modeItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sparkle className="h-3.5 w-3.5 text-purple-400" />
                  AI Segmentation Backend Vision Engine
                </label>
                <select
                  value={localCropModel}
                  onChange={(e) => handleCropModelChange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none font-mono"
                >
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Cloud AI)</option>
                  <option value="gemini-2.0-pro-exp">Gemini 2.0 Pro Experimental (High-precision)</option>
                  <option value="local-opencv">Local OpenCV (Sub-second Edge Detection)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 4: Speech Bubble & OCR Erase Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Speech Bubble Detection & Text Eraser Settings
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Configure text inpainting models and dialogue translation thresholds
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Bubble Detection Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  Dialogue Balloon Detection Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "yolo", label: "YOLO Segment" },
                    { id: "opencv", label: "OpenCV Mask" },
                    { id: "hybrid", label: "AI Hybrid" },
                  ].map((balloonItem) => (
                    <button
                      key={balloonItem.id}
                      onClick={() => handleBubbleDetectionChange(balloonItem.id)}
                      className={`py-1.5 px-1 rounded-xl border text-[10px] text-center font-bold font-mono transition-all cursor-pointer ${
                        localBubbleDetectionStyle === balloonItem.id
                          ? "bg-purple-950/20 border-purple-500 text-purple-300"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {balloonItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bubble Sensitivity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  Dialogue Threshold Sensitivity
                </label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={localBubbleSensitivity}
                    onChange={(e) => handleBubbleSensitivityChange(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#dcdcdc] shrink-0 font-semibold w-10 text-right">
                    {localBubbleSensitivity}%
                  </span>
                </div>
              </div>

              {/* Bubble Dilation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-purple-400" />
                  Erosion/Dilation Size (kernelpx)
                </label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={localBubbleDilation}
                    onChange={(e) => handleBubbleDilationChange(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[#dcdcdc] shrink-0 font-semibold w-10 text-right">
                    {localBubbleDilation}px
                  </span>
                </div>
              </div>

              {/* Bubble Erase Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Paintbrush className="h-3.5 w-3.5 text-purple-400" />
                  Text Inpaint Reconstruction Algorithm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBubbleEraseChange("telea")}
                    className={`py-1.5 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      localBubbleEraseMethod === "telea"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300"
                        : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                    }`}
                  >
                    FMM (Telea)
                  </button>
                  <button
                    onClick={() => handleBubbleEraseChange("ns")}
                    className={`py-1.5 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      localBubbleEraseMethod === "ns"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300"
                        : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Navier-Stokes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Themes, Presets & Sharing */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Palette className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Themes, Presets & Session Sharing
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Manage interface skins, load workspace bundles and export config hashes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Visual Themes selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 font-mono uppercase">
                  Interface Visual Theme Choice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "obsidian", name: "Obsidian", color: "bg-purple-600" },
                    { id: "cyberpunk", name: "Cyberpunk", color: "bg-cyan-500" },
                    { id: "slate", name: "Slate", color: "bg-zinc-400" },
                    { id: "indigo", name: "Indigo", color: "bg-indigo-500" },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setActiveTheme(theme.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer font-bold text-xs ${
                        activeTheme === theme.id
                          ? "bg-neutral-800 border-purple-500/80 text-white shadow-md"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${theme.color} shrink-0`} />
                      <span className="font-mono">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profiles preset manager */}
              <div className="space-y-2 border-t border-neutral-800/60 pt-3">
                {/* Load preset */}
                {presets.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 font-mono uppercase">
                      Load Preset Profile
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleLoadPreset(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none"
                    >
                      <option value="" disabled>
                        -- Choose a profile to load --
                      </option>
                      {presets.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Profiles lists */}
                {presets.length > 0 && (
                  <div className="max-h-20 overflow-y-auto border border-neutral-800 rounded-xl bg-neutral-950/40 p-2 divide-y divide-neutral-800 scrollbar-thin">
                    {presets.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between py-0.5 px-1 text-xs"
                      >
                        <span className="font-semibold text-neutral-350 font-mono">
                          {p.name}
                        </span>
                        <button
                          onClick={() => handleDeletePreset(p.name)}
                          className="text-neutral-500 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                          title="Delete Preset"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create profile preset */}
                <form onSubmit={handleSavePreset} className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 font-mono uppercase">
                    Save Config bundle
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.g., Action Comic Preset"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-850 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!presetName.trim()}
                      className="px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-colors active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>

              {/* Share session generator */}
              <div className="space-y-1 border-t border-neutral-800/60 pt-3">
                <button
                  onClick={handleCopyShareLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Shareable Session Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AdvancedSettings;

import React from "react";
import {
  Mic2,
  Music,
  Tv,
  Sliders,
  Palette,
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
  Clapperboard,
  ScanLine,
  Cpu,
  Share2,
  Check,
  Save,
  Layout,
  Zap,
} from "lucide-react";
import { AIModelSelector } from "@/features/ai_core";
import {
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_AUTOCROP_SETTINGS,
  DEFAULT_TTS_VOICES,
  MUSIC_THEMES_CATALOG,
} from "@/features/editor_studio/types/settings";

export interface VideoPreviewAdvancedSettingsProps {
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
  addNotification?: (msg: string, type: "success" | "info" | "warning" | "error") => void;
  fetchWithInterceptor?: any;
  audioReactiveShake: boolean;
  setAudioReactiveShake: (val: boolean) => void;
  shakeIntensity: "low" | "medium" | "high" | "extreme";
  setShakeIntensity: (val: "low" | "medium" | "high" | "extreme") => void;
  videoFormat: "mp4" | "webm" | "mkv";
  setVideoFormat: (val: "mp4" | "webm" | "mkv") => void;
  backgroundStyle: "black" | "white" | "transparent" | "blurred";
  setBackgroundStyle: (val: "black" | "white" | "transparent" | "blurred") => void;
  subtitlesStyle: "none" | "burn-in" | "soft";
  setSubtitlesStyle: (val: "none" | "burn-in" | "soft") => void;
  cropSensitivity?: number;
  setCropSensitivity?: (val: number) => void;
  cropPaddingPx?: number;
  setCropPaddingPx?: (val: number) => void;
  cropFocusMode?: string;
  setCropFocusMode?: (val: string) => void;
  cropModel?: string;
  setCropModel?: (val: string) => void;
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
  cropSensitivity?: number;
  cropPaddingPx?: number;
  cropFocusMode?: string;
  cropModel?: string;
  bubbleSensitivity?: number;
  bubbleDilation?: number;
  bubbleEraseMethod?: string;
  bubbleDetectionStyle?: string;
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconColor = "#a855f7",
  iconBg = "#a855f720",
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function OptionChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="py-1.5 px-2 text-[11px] rounded-xl border text-center font-bold font-mono transition-all duration-150"
      style={{
        borderColor: isActive ? "#7c3aed" : "#262626",
        backgroundColor: isActive ? "#7c3aed18" : "#0d0d14",
        color: isActive ? "#c4b5fd" : "#6b7280",
      }}
    >
      {label}
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color = "#a855f7",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-400">{label}</span>
        <span
          className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {value}{unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-12 rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none flex-shrink-0"
      style={{ backgroundColor: value ? "#7c3aed" : "#374151" }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
        style={{ transform: value ? "translateX(24px)" : "translateX(0px)" }}
      />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const VideoPreviewAdvancedSettings = React.memo(
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

    audioReactiveShake,
    setAudioReactiveShake,
    shakeIntensity,
    setShakeIntensity,
    videoFormat,
    setVideoFormat,
    backgroundStyle,
    setBackgroundStyle,
    subtitlesStyle,
    setSubtitlesStyle,

    cropSensitivity = DEFAULT_AUTOCROP_SETTINGS.sensitivity,
    setCropSensitivity,
    cropPaddingPx = DEFAULT_AUTOCROP_SETTINGS.padding,
    setCropPaddingPx,
    cropFocusMode = "standard",
    setCropFocusMode,
    cropModel = DEFAULT_AUTOCROP_SETTINGS.cropModel,
    setCropModel,

    bubbleSensitivity = 50,
    setBubbleSensitivity,
    bubbleDilation = 5,
    setBubbleDilation,
    bubbleEraseMethod = "telea",
    setBubbleEraseMethod,
    bubbleDetectionStyle = "hybrid",
    setBubbleDetectionStyle,
  }: VideoPreviewAdvancedSettingsProps) => {
    const [activeTab, setActiveTab] = React.useState<"render" | "ai" | "themes">("render");
    const [presetName, setPresetName] = React.useState("");
    const [copied, setCopied] = React.useState(false);

    // ── Local state fallbacks ──────────────────────────────────────────────
    const [localCropSensitivity, setLocalCropSensitivity] = React.useState(() =>
      parseInt(localStorage.getItem("ai_crop_sensitivity") || String(cropSensitivity), 10)
    );
    const [localCropPaddingPx, setLocalCropPaddingPx] = React.useState(() =>
      parseInt(localStorage.getItem("ai_crop_padding") || String(cropPaddingPx), 10)
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

    // ── Persist to localStorage ────────────────────────────────────────────
    React.useEffect(() => { localStorage.setItem("ai_crop_sensitivity", String(localCropSensitivity)); }, [localCropSensitivity]);
    React.useEffect(() => { localStorage.setItem("ai_crop_padding", String(localCropPaddingPx)); }, [localCropPaddingPx]);
    React.useEffect(() => { localStorage.setItem("ai_crop_focus_mode", localCropFocusMode); }, [localCropFocusMode]);
    React.useEffect(() => { localStorage.setItem("ai_crop_model", localCropModel); }, [localCropModel]);
    React.useEffect(() => { localStorage.setItem("ai_bubble_sensitivity", String(localBubbleSensitivity)); }, [localBubbleSensitivity]);
    React.useEffect(() => { localStorage.setItem("ai_bubble_dilation", String(localBubbleDilation)); }, [localBubbleDilation]);
    React.useEffect(() => { localStorage.setItem("ai_bubble_erase_method", localBubbleEraseMethod); }, [localBubbleEraseMethod]);
    React.useEffect(() => { localStorage.setItem("ai_bubble_detection_style", localBubbleDetectionStyle); }, [localBubbleDetectionStyle]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleCropSensitivityChange = (v: number) => { setLocalCropSensitivity(v); setCropSensitivity?.(v); };
    const handleCropPaddingChange = (v: number) => { setLocalCropPaddingPx(v); setCropPaddingPx?.(v); };
    const handleCropFocusChange = (v: string) => { setLocalCropFocusMode(v); setCropFocusMode?.(v); };
    const handleCropModelChange = (v: string) => { setLocalCropModel(v); setCropModel?.(v); };
    const handleBubbleSensitivityChange = (v: number) => { setLocalBubbleSensitivity(v); setBubbleSensitivity?.(v); };
    const handleBubbleDilationChange = (v: number) => { setLocalBubbleDilation(v); setBubbleDilation?.(v); };
    const handleBubbleEraseChange = (v: string) => { setLocalBubbleEraseMethod(v); setBubbleEraseMethod?.(v); };
    const handleBubbleDetectionChange = (v: string) => { setLocalBubbleDetectionStyle(v); setBubbleDetectionStyle?.(v); };

    // ── Presets ───────────────────────────────────────────────────────────
    const [presets, setPresets] = React.useState<WorkspacePreset[]>(() => {
      try {
        const stored = localStorage.getItem("ai_comic_presets");
        if (stored) return JSON.parse(stored);
      } catch { /* empty */ }
      return [
        { name: "Action Comic", voiceActor: DEFAULT_TTS_VOICES[0]?.code || "en-US-GuyNeural", musicTheme: MUSIC_THEMES_CATALOG[0]?.id || "orchestral_battle", aspectRatio: "16:9", frameRate: 30, activeTheme: "cyberpunk", audioReactiveShake: true, shakeIntensity: "high", videoFormat: "mp4", backgroundStyle: "black", subtitlesStyle: "burn-in", cropSensitivity: DEFAULT_AUTOCROP_SETTINGS.sensitivity, cropPaddingPx: DEFAULT_AUTOCROP_SETTINGS.padding, cropFocusMode: "standard", cropModel: DEFAULT_AUTOCROP_SETTINGS.cropModel, bubbleSensitivity: 50, bubbleDilation: 5, bubbleEraseMethod: "telea", bubbleDetectionStyle: "hybrid" },
        { name: "B&W Manga", voiceActor: DEFAULT_TTS_VOICES[1]?.code || "en-US-JennyNeural", musicTheme: MUSIC_THEMES_CATALOG[1]?.id || "mysterious_ambience", aspectRatio: "9:16", frameRate: 24, activeTheme: "obsidian", audioReactiveShake: false, shakeIntensity: "medium", videoFormat: "mp4", backgroundStyle: "white", subtitlesStyle: "none", cropSensitivity: DEFAULT_AUTOCROP_SETTINGS.sensitivity, cropPaddingPx: DEFAULT_AUTOCROP_SETTINGS.padding, cropFocusMode: "face", cropModel: DEFAULT_AUTOCROP_SETTINGS.cropModel, bubbleSensitivity: 60, bubbleDilation: 3, bubbleEraseMethod: "ns", bubbleDetectionStyle: "yolo" },
      ];
    });

    const handleSavePreset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!presetName.trim()) return;
      const newPreset: WorkspacePreset = { name: presetName.trim(), voiceActor, musicTheme, aspectRatio, frameRate, activeTheme, audioReactiveShake, shakeIntensity, videoFormat, backgroundStyle, subtitlesStyle, cropSensitivity: localCropSensitivity, cropPaddingPx: localCropPaddingPx, cropFocusMode: localCropFocusMode, cropModel: localCropModel, bubbleSensitivity: localBubbleSensitivity, bubbleDilation: localBubbleDilation, bubbleEraseMethod: localBubbleEraseMethod, bubbleDetectionStyle: localBubbleDetectionStyle };
      const updated = [...presets.filter((p) => p.name !== newPreset.name), newPreset];
      setPresets(updated);
      localStorage.setItem("ai_comic_presets", JSON.stringify(updated));
      setPresetName("");
      addNotification?.(`Preset "${newPreset.name}" saved!`, "success");
    };

    const handleLoadPreset = (name: string) => {
      const p = presets.find((x) => x.name === name);
      if (!p) return;
      setVoiceActor(p.voiceActor); setMusicTheme(p.musicTheme); setAspectRatio(p.aspectRatio); setFrameRate(p.frameRate); setActiveTheme(p.activeTheme);
      if (p.audioReactiveShake !== undefined) setAudioReactiveShake(p.audioReactiveShake);
      if (p.shakeIntensity !== undefined) setShakeIntensity(p.shakeIntensity);
      if (p.videoFormat !== undefined) setVideoFormat(p.videoFormat);
      if (p.backgroundStyle !== undefined) setBackgroundStyle(p.backgroundStyle);
      if (p.subtitlesStyle !== undefined) setSubtitlesStyle(p.subtitlesStyle);
      if (p.cropSensitivity !== undefined) handleCropSensitivityChange(p.cropSensitivity);
      if (p.cropPaddingPx !== undefined) handleCropPaddingChange(p.cropPaddingPx);
      if (p.cropFocusMode !== undefined) handleCropFocusChange(p.cropFocusMode);
      if (p.cropModel !== undefined) handleCropModelChange(p.cropModel);
      if (p.bubbleSensitivity !== undefined) handleBubbleSensitivityChange(p.bubbleSensitivity);
      if (p.bubbleDilation !== undefined) handleBubbleDilationChange(p.bubbleDilation);
      if (p.bubbleEraseMethod !== undefined) handleBubbleEraseChange(p.bubbleEraseMethod);
      if (p.bubbleDetectionStyle !== undefined) handleBubbleDetectionChange(p.bubbleDetectionStyle);
      addNotification?.(`Loaded "${name}"`, "info");
    };

    const handleDeletePreset = (name: string) => {
      const updated = presets.filter((p) => p.name !== name);
      setPresets(updated);
      localStorage.setItem("ai_comic_presets", JSON.stringify(updated));
      addNotification?.(`Deleted "${name}"`, "info");
    };

    const handleCopyShareLink = () => {
      try {
        const hash = btoa(JSON.stringify({ url: targetUrl, voice: voiceActor, music: musicTheme, aspectRatio, fps: frameRate, model: selectedModel, source: selectedSource, audioReactiveShake, shakeIntensity, videoFormat, backgroundStyle, subtitlesStyle, cropSensitivity: localCropSensitivity, cropPaddingPx: localCropPaddingPx, cropFocusMode: localCropFocusMode, cropModel: localCropModel, bubbleSensitivity: localBubbleSensitivity, bubbleDilation: localBubbleDilation, bubbleEraseMethod: localBubbleEraseMethod, bubbleDetectionStyle: localBubbleDetectionStyle }));
        const shareUrl = `${window.location.origin}${window.location.pathname}?state=${hash}`;
        navigator.clipboard.writeText(shareUrl).catch(() => {
          const t = document.createElement("textarea"); t.value = shareUrl;
          document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        addNotification?.("Session link copied!", "success");
      } catch {
        addNotification?.("Failed to copy link.", "error");
      }
    };

    const tabs = [
      { id: "render" as const, label: "Render", icon: Clapperboard },
      { id: "ai" as const, label: "AI Vision", icon: Cpu },
      { id: "themes" as const, label: "Themes & Presets", icon: Palette },
    ];

    const cardStyle: React.CSSProperties = { backgroundColor: "#0a0a12", borderColor: "#1e1e30" };

    return (
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-neutral-900 rounded-2xl border border-neutral-800 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  color: isActive ? "#fff" : "#6b7280",
                  backgroundColor: isActive ? "#7c3aed22" : "transparent",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isActive ? "#7c3aed55" : "transparent",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── RENDER TAB ─────────────────────────────────────────────────── */}
        {activeTab === "render" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Compile Specs */}
            <div className="rounded-2xl border p-5 space-y-5" style={cardStyle}>
              <SectionHeader
                icon={Tv}
                title="Output Specifications"
                subtitle="Aspect ratio, frame rate, and codec format"
                iconColor="#a855f7"
                iconBg="#a855f720"
              />

              <div className="space-y-5">
                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Layout className="h-3.5 w-3.5 text-purple-400" />
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "auto" as const, label: "Auto", sub: "Detect" },
                      { id: "9:16" as const, label: "9:16", sub: "Portrait" },
                      { id: "16:9" as const, label: "16:9", sub: "Landscape" },
                    ].map(({ id, label, sub }) => {
                      const isActive = aspectRatio === id || (!aspectRatio && id === "auto");
                      return (
                        <button
                          key={id}
                          onClick={() => setAspectRatio(id)}
                          className="py-2.5 px-2 rounded-xl border text-center transition-all duration-150 space-y-0.5"
                          style={{
                            borderColor: isActive ? "#7c3aed" : "#1e1e30",
                            backgroundColor: isActive ? "#7c3aed18" : "#0d0d14",
                          }}
                        >
                          <div className="text-xs font-bold font-mono" style={{ color: isActive ? "#c4b5fd" : "#6b7280" }}>{label}</div>
                          <div className="text-[10px] text-neutral-500">{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame Rate */}
                <SliderRow
                  label="Frame Rate"
                  value={frameRate}
                  min={12}
                  max={60}
                  step={6}
                  unit=" FPS"
                  onChange={setFrameRate}
                  color="#a855f7"
                />

                {/* Video Format */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Disc className="h-3.5 w-3.5 text-purple-400" />
                    Output Codec
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "mp4", label: "MP4", sub: "H.264" },
                      { id: "webm", label: "WebM", sub: "VP9" },
                      { id: "mkv", label: "MKV", sub: "HEVC" },
                    ].map(({ id, label, sub }) => (
                      <button
                        key={id}
                        onClick={() => setVideoFormat(id as any)}
                        className="py-2.5 px-2 rounded-xl border text-center transition-all duration-150 space-y-0.5"
                        style={{
                          borderColor: videoFormat === id ? "#7c3aed" : "#1e1e30",
                          backgroundColor: videoFormat === id ? "#7c3aed18" : "#0d0d14",
                        }}
                      >
                        <div className="text-xs font-bold font-mono" style={{ color: videoFormat === id ? "#c4b5fd" : "#6b7280" }}>{label}</div>
                        <div className="text-[10px] text-neutral-500">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Composition & Effects */}
            <div className="rounded-2xl border p-5 space-y-5" style={cardStyle}>
              <SectionHeader
                icon={Video}
                title="Composition & Effects"
                subtitle="Camera motion, background fill, and captions"
                iconColor="#6366f1"
                iconBg="#6366f120"
              />

              <div className="space-y-5">
                {/* Camera Shake */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        Audio-Reactive Camera Shake
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 ml-5">Syncs shake to audio energy peaks</div>
                    </div>
                    <Toggle value={audioReactiveShake} onChange={setAudioReactiveShake} />
                  </div>
                  {audioReactiveShake && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {(["low", "medium", "high", "extreme"] as const).map((intensity) => (
                        <OptionChip
                          key={intensity}
                          label={intensity}
                          isActive={shakeIntensity === intensity}
                          onClick={() => setShakeIntensity(intensity)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Background Style */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Paintbrush className="h-3.5 w-3.5 text-indigo-400" />
                    Letterbox Fill
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "black", label: "⬛ Black", sub: "Cinema bars" },
                      { id: "white", label: "⬜ White", sub: "Manga style" },
                      { id: "transparent", label: "◻️ Clear", sub: "Alpha channel" },
                      { id: "blurred", label: "🌫️ Blurred", sub: "Extend fill" },
                    ].map(({ id, label, sub }) => (
                      <button
                        key={id}
                        onClick={() => setBackgroundStyle(id as any)}
                        className="py-2 px-3 rounded-xl border text-left transition-all duration-150"
                        style={{
                          borderColor: backgroundStyle === id ? "#6366f1" : "#1e1e30",
                          backgroundColor: backgroundStyle === id ? "#6366f118" : "#0d0d14",
                        }}
                      >
                        <div className="text-xs font-semibold" style={{ color: backgroundStyle === id ? "#a5b4fc" : "#6b7280" }}>{label}</div>
                        <div className="text-[10px] text-neutral-500">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitles */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Subtitles className="h-3.5 w-3.5 text-indigo-400" />
                    Subtitle Baking
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "none", label: "None" },
                      { id: "burn-in", label: "Burn-in" },
                      { id: "soft", label: "Soft" },
                    ].map(({ id, label }) => (
                      <OptionChip
                        key={id}
                        label={label}
                        isActive={subtitlesStyle === id}
                        onClick={() => setSubtitlesStyle(id as any)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI VISION TAB ──────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Smart Crop Card */}
            <div className="rounded-2xl border p-5 space-y-5" style={cardStyle}>
              <SectionHeader
                icon={Scissors}
                title="AI Smart Crop"
                subtitle="Panel segmentation and cinematic reframing"
                iconColor="#10b981"
                iconBg="#10b98120"
              />

              <div className="space-y-4">
                <SliderRow
                  label="Edge Detection Sensitivity"
                  value={localCropSensitivity}
                  min={10}
                  max={90}
                  step={5}
                  unit="%"
                  onChange={handleCropSensitivityChange}
                  color="#10b981"
                />
                <SliderRow
                  label="Safety Padding Margin"
                  value={localCropPaddingPx}
                  min={0}
                  max={50}
                  step={2}
                  unit="px"
                  onChange={handleCropPaddingChange}
                  color="#06b6d4"
                />

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <ScanLine className="h-3.5 w-3.5 text-emerald-400" />
                    Framing Focus Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "standard", label: "Standard" },
                      { id: "tight", label: "Tight" },
                      { id: "face", label: "Face Zoom" },
                    ].map(({ id, label }) => (
                      <OptionChip
                        key={id}
                        label={label}
                        isActive={localCropFocusMode === id}
                        onClick={() => handleCropFocusChange(id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Sparkle className="h-3.5 w-3.5 text-emerald-400" />
                    AI Vision Backend
                  </label>
                  <AIModelSelector value={localCropModel} onChange={handleCropModelChange} />
                </div>
              </div>
            </div>

            {/* Bubble Detection Card */}
            <div className="rounded-2xl border p-5 space-y-5" style={cardStyle}>
              <SectionHeader
                icon={MessageSquare}
                title="Speech Bubble Eraser"
                subtitle="Dialogue detection and text inpainting"
                iconColor="#f59e0b"
                iconBg="#f59e0b20"
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Detection Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "yolo", label: "YOLO" },
                      { id: "opencv", label: "OpenCV" },
                      { id: "hybrid", label: "AI Hybrid" },
                    ].map(({ id, label }) => (
                      <OptionChip
                        key={id}
                        label={label}
                        isActive={localBubbleDetectionStyle === id}
                        onClick={() => handleBubbleDetectionChange(id)}
                      />
                    ))}
                  </div>
                </div>

                <SliderRow
                  label="Detection Threshold"
                  value={localBubbleSensitivity}
                  min={10}
                  max={90}
                  step={5}
                  unit="%"
                  onChange={handleBubbleSensitivityChange}
                  color="#f59e0b"
                />
                <SliderRow
                  label="Dilation Kernel Size"
                  value={localBubbleDilation}
                  min={1}
                  max={15}
                  step={1}
                  unit="px"
                  onChange={handleBubbleDilationChange}
                  color="#ef4444"
                />

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                    <Paintbrush className="h-3.5 w-3.5 text-amber-400" />
                    Inpaint Algorithm
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleBubbleEraseChange("telea")}
                      className="py-2.5 px-3 rounded-xl border text-center transition-all"
                      style={{
                        borderColor: localBubbleEraseMethod === "telea" ? "#f59e0b" : "#1e1e30",
                        backgroundColor: localBubbleEraseMethod === "telea" ? "#f59e0b18" : "#0d0d14",
                      }}
                    >
                      <div className="text-xs font-bold font-mono" style={{ color: localBubbleEraseMethod === "telea" ? "#fcd34d" : "#6b7280" }}>FMM (Telea)</div>
                      <div className="text-[10px] text-neutral-500">Fast marching</div>
                    </button>
                    <button
                      onClick={() => handleBubbleEraseChange("ns")}
                      className="py-2.5 px-3 rounded-xl border text-center transition-all"
                      style={{
                        borderColor: localBubbleEraseMethod === "ns" ? "#f59e0b" : "#1e1e30",
                        backgroundColor: localBubbleEraseMethod === "ns" ? "#f59e0b18" : "#0d0d14",
                      }}
                    >
                      <div className="text-xs font-bold font-mono" style={{ color: localBubbleEraseMethod === "ns" ? "#fcd34d" : "#6b7280" }}>Navier-Stokes</div>
                      <div className="text-[10px] text-neutral-500">Fluid diffusion</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── THEMES & PRESETS TAB ───────────────────────────────────────── */}
        {activeTab === "themes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Themes */}
            <div className="rounded-2xl border p-5 space-y-5" style={cardStyle}>
              <SectionHeader
                icon={Palette}
                title="Interface Theme"
                subtitle="Visual skin for the editor workspace"
                iconColor="#ec4899"
                iconBg="#ec489920"
              />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "obsidian", name: "Obsidian", color: "#a855f7", desc: "Dark purple" },
                  { id: "cyberpunk", name: "Cyberpunk", color: "#06b6d4", desc: "Neon cyan" },
                  { id: "slate", name: "Slate", color: "#94a3b8", desc: "Cool grey" },
                  { id: "indigo", name: "Indigo", color: "#6366f1", desc: "Deep indigo" },
                ].map((theme) => {
                  const isActive = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setActiveTheme(theme.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200"
                      style={{
                        borderColor: isActive ? theme.color : "#1e1e30",
                        backgroundColor: isActive ? `${theme.color}18` : "#0d0d14",
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${theme.color}33` }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                      </span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: isActive ? "#f1f5f9" : "#9ca3af" }}>{theme.name}</div>
                        <div className="text-[10px] text-neutral-500">{theme.desc}</div>
                      </div>
                      {isActive && (
                        <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.color }}>
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets & Sharing */}
            <div className="rounded-2xl border p-5 space-y-4" style={cardStyle}>
              <SectionHeader
                icon={Save}
                title="Workspace Presets"
                subtitle="Save and restore full configuration bundles"
                iconColor="#8b5cf6"
                iconBg="#8b5cf620"
              />

              {/* Preset list */}
              {presets.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#4b2d7e transparent" }}>
                  {presets.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border"
                      style={{ borderColor: "#1e1e30", backgroundColor: "#0d0d14" }}
                    >
                      <span className="text-[11px] font-semibold text-neutral-300 font-mono truncate">{p.name}</span>
                      <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleLoadPreset(p.name)}
                          className="text-[10px] px-2 py-1 rounded-lg font-bold text-purple-400 hover:bg-purple-600/20 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeletePreset(p.name)}
                          className="p-1 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Save new preset */}
              <form onSubmit={handleSavePreset} className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Save Current Config</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Action Comic Preset"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none placeholder-neutral-600"
                  />
                  <button
                    type="submit"
                    disabled={!presetName.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    Save
                  </button>
                </div>
              </form>

              {/* Share link */}
              <div className="pt-1 border-t border-neutral-800">
                <button
                  onClick={handleCopyShareLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200"
                  style={{
                    background: copied
                      ? "linear-gradient(135deg, #16a34a, #15803d)"
                      : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    boxShadow: copied ? "0 0 16px #16a34a44" : "0 0 16px #7c3aed44",
                  }}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5" /> Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy Shareable Session Link</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default VideoPreviewAdvancedSettings;
export { VideoPreviewAdvancedSettings };

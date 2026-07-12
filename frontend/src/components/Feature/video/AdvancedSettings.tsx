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
} from "lucide-react";

interface AdvancedSettingsProps {
  voiceActor: string;
  setVoiceActor: (val: string) => void;
  musicTheme: string;
  setMusicTheme: (val: string) => void;
  aspectRatio: "9:16" | "16:9";
  setAspectRatio: (val: "9:16" | "16:9") => void;
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
}

interface WorkspacePreset {
  name: string;
  voiceActor: string;
  musicTheme: string;
  aspectRatio: "9:16" | "16:9";
  frameRate: number;
  activeTheme: string;
  audioReactiveShake?: boolean;
  shakeIntensity?: "low" | "medium" | "high" | "extreme";
  videoFormat?: "mp4" | "webm" | "mkv";
  backgroundStyle?: "black" | "white" | "transparent" | "blurred";
  subtitlesStyle?: "none" | "burn-in" | "soft";
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
                  Customize audio, aspect ratios, and visual output presets
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Dynamic Voice Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between gap-1.5 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5 text-purple-400" />
                    AI Voice Speaker Character
                  </span>
                  {loadingVoices && (
                    <span className="text-[10px] text-purple-400 animate-pulse font-bold">
                      Loading server voices...
                    </span>
                  )}
                </label>
                <select
                  id="voice_select"
                  value={voiceActor}
                  onChange={(e) => setVoiceActor(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none"
                >
                  {displayVoices.map((voice) => (
                    <option key={voice.code} value={voice.code}>
                      {voice.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Music Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Music className="h-3.5 w-3.5 text-purple-400" />
                  Thematic Soundtrack Loop
                </label>
                <select
                  id="bg_music_select"
                  value={musicTheme}
                  onChange={(e) => setMusicTheme(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-300 focus:border-purple-500 outline-none"
                >
                  <option>Orchestral Battle Theme</option>
                  <option>Mysterious Ambience</option>
                  <option>Sci-Fi Synth Wave</option>
                  <option>Calm Acoustic Melancholy</option>
                  <option>No Music (Dialogue Only)</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                  <Tv className="h-3.5 w-3.5 text-purple-400" />
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-1.5 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
                      aspectRatio === "9:16"
                        ? "bg-purple-950/20 border-purple-500 text-purple-300 shadow-inner"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    9:16 Portrait
                  </button>
                  <button
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-1.5 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold font-mono ${
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

        {/* RIGHT COLUMN: Workspace Profiles & Themes */}
        <div className="space-y-6">
          {/* Visual Themes Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Palette className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Custom visual UI Themes
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Instantly customize visual color schemes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: "obsidian",
                  name: "Midnight Obsidian",
                  color: "bg-purple-600",
                },
                {
                  id: "cyberpunk",
                  name: "Neon Cyberpunk",
                  color: "bg-cyan-500",
                },
                { id: "slate", name: "Slate Minimal", color: "bg-zinc-400" },
                {
                  id: "indigo",
                  name: "Electric Indigo",
                  color: "bg-indigo-500",
                },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer font-bold text-xs ${
                    activeTheme === theme.id
                      ? "bg-neutral-800 border-purple-500/80 text-white shadow-md"
                      : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full ${theme.color} shrink-0`}
                  />
                  <span className="font-mono">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Presets Manager */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Save className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Workspace Preset Profiles
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Store and load config bundles instantly
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Load preset */}
              {presets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 font-mono uppercase">
                    Load Preset Profile
                  </label>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleLoadPreset(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="flex-1 bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2 text-neutral-350 focus:border-purple-500 outline-none"
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
                </div>
              )}

              {/* List of profiles with delete options */}
              {presets.length > 0 && (
                <div className="max-h-24 overflow-y-auto border border-neutral-800 rounded-xl bg-neutral-950/40 p-2 divide-y divide-neutral-800 scrollbar-thin">
                  {presets.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between py-1 px-1.5 text-xs"
                    >
                      <span className="font-semibold text-neutral-300 font-mono">
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

              {/* Create new preset */}
              <form onSubmit={handleSavePreset} className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-neutral-500 font-mono uppercase">
                  Save Current Config As Preset
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
                    className="px-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-colors active:scale-95 flex items-center justify-center"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Share session generator */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white font-sans">
                    Workspace Session Sharing
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Create an instant share link containing active
                    configurations
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyShareLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20 cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              Copy Shareable Session Link
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default AdvancedSettings;

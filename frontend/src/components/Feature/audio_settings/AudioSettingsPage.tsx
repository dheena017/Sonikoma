import React, { useState, useEffect } from "react";
import {
  Mic,
  Music,
  Sliders,
  Save,
  ArrowLeft,
  Sparkles,
  Volume2,
  Volume1,
  Activity,
  Disc,
} from "lucide-react";

interface AudioSettingsPageProps {
  projectId?: string | null;
  onNavigateHome?: () => void;
  addNotification?: (msg: string, type: "success" | "info" | "warning" | "error") => void;
  fetchWithInterceptor?: any;
  isEmbed?: boolean;
  onVoiceActorChange?: (val: string) => void;
  onMusicThemeChange?: (val: string) => void;
}

const DEFAULT_AUDIO_SETTINGS = {
  masterVolume: 80,
  narrationVolume: 90,
  bgmVolume: 50,
  sfxVolume: 75,
  speechRate: 1.0,
  speechPitch: 1.0,
  musicTheme: "Orchestral Battle Theme",
  audioDucking: true,
  voiceActor: "en-US-GuyNeural",
};

interface AudioSettingsPageProps {
  projectId?: string | null;
  onNavigateHome?: () => void;
  addNotification?: (msg: string, type: "success" | "info" | "warning" | "error") => void;
  fetchWithInterceptor?: any;
  isEmbed?: boolean;
  
  volume: number;
  setVolume: (val: number) => void;
  narrationVolume: number;
  setNarrationVolume: (val: number) => void;
  bgmVolume: number;
  setBgmVolume: (val: number) => void;
  sfxVolume: number;
  setSfxVolume: (val: number) => void;
  speechRate: number;
  setSpeechRate: (val: number) => void;
  speechPitch: number;
  setSpeechPitch: (val: number) => void;
  voiceActor: string;
  setVoiceActor: (val: string) => void;
  musicTheme: string;
  setMusicTheme: (val: string) => void;
  audioDucking: boolean;
  setAudioDucking: (val: boolean) => void;
  onSave?: () => void;
}

export default function AudioSettingsPage({
  projectId: propProjectId,
  onNavigateHome,
  addNotification,
  fetchWithInterceptor,
  isEmbed = false,

  volume,
  setVolume,
  narrationVolume,
  setNarrationVolume,
  bgmVolume,
  setBgmVolume,
  sfxVolume,
  setSfxVolume,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
  voiceActor,
  setVoiceActor,
  musicTheme,
  setMusicTheme,
  audioDucking,
  setAudioDucking,
  onSave,
}: AudioSettingsPageProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Aliases to match parent state prop names to variables used in the JSX
  const masterVolume = volume;
  const setMasterVolume = setVolume;

  // Available Voices
  const [availableVoices, setAvailableVoices] = useState<Array<{ code: string; label: string }>>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  const [localNarratorVoice, setLocalNarratorVoice] = useState<string>(
    () => localStorage.getItem("ai_comic_narrator_voice") || "Sultry Narrative Tone (Female)"
  );

  // 1. Resolve projectId from URL query parameters if not passed as prop
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("project_id") || propProjectId;
    if (id) {
      setProjectId(id);
    }
  }, [propProjectId]);

  // 2. Fetch voices list from backend on mount
  useEffect(() => {
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
        console.error("Failed to load server voices:", e);
      } finally {
        if (active) setLoadingVoices(false);
      }
    };
    loadVoices();
    return () => {
      active = false;
    };
  }, [fetchWithInterceptor]);

  // 4. Save Audio Mixer Profile
  const handleSaveSettings = async () => {
    if (onSave) {
      onSave();
      return;
    }

    // Save narrator voice choice directly
    localStorage.setItem("ai_comic_narrator_voice", localNarratorVoice);

    if (!projectId) {
      // Local Storage Fallback if no project is active
      const localSettings = {
        masterVolume: volume,
        narrationVolume,
        bgmVolume,
        sfxVolume,
        speechRate,
        speechPitch,
        voiceActor,
        musicTheme,
        audioDucking,
      };
      localStorage.setItem("global_audio_settings", JSON.stringify(localSettings));
      if (addNotification) {
        addNotification("Saved global audio fallback profile to browser cache.", "success");
      }
      return;
    }

    setSaving(true);
    try {
      const fetchFn = fetchWithInterceptor || window.fetch.bind(window);

      const payload = {
        audio_settings: {
          masterVolume: volume,
          narrationVolume,
          bgmVolume,
          sfxVolume,
          speechRate,
          speechPitch,
          voiceActor,
          musicTheme,
          audioDucking,
        },
      };

      const res = await fetchFn(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.success) {
        if (addNotification) {
          addNotification("Successfully compiled and persisted project audio settings!", "success");
        }
      } else {
        throw new Error(data?.detail || "Unsuccessful update response");
      }
    } catch (e: any) {
      console.error("Failed to save audio settings:", e);
      if (addNotification) {
        addNotification(`Error saving audio profile: ${e.message || String(e)}`, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const defaultVoices = [
    { code: "en-US-GuyNeural", label: "English (US) — Guy (Male)" },
    { code: "en-US-JennyNeural", label: "English (US) — Jenny (Female)" },
    { code: "en-US-AriaNeural", label: "English (US) — Aria (Female)" },
    { code: "en-GB-SoniaNeural", label: "English (UK) — Sonia (Female)" },
  ];

  const displayVoices = availableVoices.length > 0 ? availableVoices : defaultVoices;

  return (
    <div className={isEmbed ? "w-full space-y-6 pt-2" : "flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6"}>
      {/* HEADER SECTION */}
      {!isEmbed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Audio & TTS Mixer</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <Mic className="h-5 w-5" />
              </div>
              Audio & TTS Settings
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Synchronize narration character, configure pitch and rate, and mix sound loop presets
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:text-white text-neutral-450 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          <span className="text-xs font-mono text-neutral-400">Loading audio profiles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT PANEL: AUDIO VOLUME MIXER DASHBOARD */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Sliders className="h-4 w-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-sans">
                  Audio Volume Mixer Dashboard
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Balance audio gains across distinct output sound pipelines
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Master Volume */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-purple-400" />
                    Master Volume Gain
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-bold">{masterVolume}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1.5 rounded-lg"
                />
              </div>

              {/* Narration/TTS Volume */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Mic className="h-4 w-4 text-purple-400" />
                    Narration / Voice Track Gain
                  </span>
                  <span className="text-xs font-mono text-neutral-200 font-bold">{narrationVolume}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={narrationVolume}
                  onChange={(e) => setNarrationVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1.5 rounded-lg"
                />
              </div>

              {/* BGM Volume */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Music className="h-4 w-4 text-purple-400" />
                    Thematic Background Music Gain
                  </span>
                  <span className="text-xs font-mono text-neutral-200 font-bold">{bgmVolume}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1.5 rounded-lg"
                />
              </div>

              {/* SFX Volume */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Volume1 className="h-4 w-4 text-purple-400" />
                    Atmospheric Sound Effects Gain
                  </span>
                  <span className="text-xs font-mono text-neutral-200 font-bold">{sfxVolume}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1.5 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: VOICE CHARACTERS & EXPERIMENTAL TTS CONTROLS */}
          <div className="space-y-6">
            {/* CARD 1: Voice Characters selection */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Activity className="h-4 w-4 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white font-sans">
                    Voice Actor & Speech Synthesizer Controls
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Select active vocal profiles and modify speech pace properties
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Voice Speaker Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between gap-1.5 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-purple-400" />
                      AI Voice Speaker Character
                    </span>
                    {loadingVoices && (
                      <span className="text-[10px] text-purple-400 animate-pulse font-bold">
                        Loading...
                      </span>
                    )}
                  </label>
                  <select
                    id="voice_select"
                    value={voiceActor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVoiceActor(val);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2.5 text-neutral-300 focus:border-purple-500 outline-none"
                  >
                    {displayVoices.map((voice) => (
                      <option key={voice.code} value={voice.code}>
                        {voice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dedicated Narrator Voice Profile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between gap-1.5 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      Dedicated Narrator Voice Profile
                    </span>
                  </label>
                  <select
                    value={localNarratorVoice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalNarratorVoice(val);
                      localStorage.setItem("ai_comic_narrator_voice", val);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2.5 text-neutral-300 focus:border-purple-500 outline-none"
                  >
                    {displayVoices.map((voice) => (
                      <option key={voice.code} value={voice.code}>
                        {voice.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speech Rate (Speed) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                    <span>Vocal Playback Speech Rate (Speed)</span>
                    <span className="text-xs font-mono text-neutral-200 font-bold">{speechRate}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1 rounded"
                  />
                </div>

                {/* Speech Pitch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between font-mono">
                    <span>Vocal Resonance Pitch Frequency</span>
                    <span className="text-xs font-mono text-neutral-200 font-bold">{speechPitch}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(Number(e.target.value))}
                    className="w-full accent-purple-500 bg-neutral-800 cursor-pointer h-1 rounded"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Soundtrack loops and Ducking Settings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Disc className="h-4 w-4 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white font-sans">
                    Soundtrack loops and Ducking Settings
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Control background music styles and automatic speech ducking
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Soundtrack loops */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                    <Music className="h-3.5 w-3.5 text-purple-400" />
                    Thematic Soundtrack Loop
                  </label>
                  <select
                    id="bg_music_select"
                    value={musicTheme}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMusicTheme(val);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2.5 text-neutral-300 focus:border-purple-500 outline-none"
                  >
                    <option>Orchestral Battle Theme</option>
                    <option>Mysterious Ambience</option>
                    <option>Sci-Fi Synth Wave</option>
                    <option>Calm Acoustic Melancholy</option>
                    <option>No Music (Dialogue Only)</option>
                  </select>
                </div>

                {/* Audio Ducking Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-400 flex flex-col font-mono">
                    <span>Intelligent Audio Ducking</span>
                    <span className="text-[10px] text-neutral-500 font-sans mt-0.5">
                      Dynamically quiet soundtrack during spoken lines
                    </span>
                  </label>
                  <button
                    onClick={() => setAudioDucking(!audioDucking)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      audioDucking ? "bg-purple-600" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        audioDucking ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVE CONTROL ACTION FOOTER */}
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-mono text-neutral-400">
            {projectId
              ? `Configuring Audio Matrix profile for Chapter: "${projectId}"`
              : "No active chapter open; configuring global fallback options."}
          </span>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-purple-950/20"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Mix..." : "Save Audio Mixer Settings"}
        </button>
      </div>
    </div>
  );
}

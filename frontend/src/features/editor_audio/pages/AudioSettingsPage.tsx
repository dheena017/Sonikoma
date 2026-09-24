import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mic,
  Music,
  Sliders,
  Save,
  Volume2,
  Volume1,
  Activity,
  Disc,
  Sparkles,
  Play,
  Zap,
  Radio,
  AudioWaveform,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  Globe,
  MessageSquare,
} from "lucide-react";
import { MUSIC_THEMES_CATALOG, DEFAULT_TTS_VOICES } from "@/features/editor_studio/types/settings";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

const MUSIC_THEMES = MUSIC_THEMES_CATALOG;

interface AudioSettingsPageProps {
  projectId?: string | null;
  onNavigateHome?: () => void;
  addNotification?: (
    msg: string,
    type: "success" | "info" | "warning" | "error"
  ) => void;
  fetchWithInterceptor?: any;
  isEmbed?: boolean;
  onVoiceActorChange?: (val: string) => void;
  onMusicThemeChange?: (val: string) => void;

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
  enableDialogueAudio?: boolean;
  setEnableDialogueAudio?: (val: boolean) => void;
  enableNarrativeAudio?: boolean;
  setEnableNarrativeAudio?: (val: boolean) => void;
  onSave?: () => void;
}

// Animated waveform bars for visual feedback
function WaveformBars({ active, color = "#3b82f6" }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[3, 5, 8, 6, 9, 5, 7, 4, 8, 5, 3].map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: active ? `${h * 1.6}px` : "3px",
            backgroundColor: color,
            borderRadius: 2,
            transition: `height ${0.15 + i * 0.04}s ease-in-out`,
            opacity: active ? 0.7 + (i % 3) * 0.1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

// Premium volume slider with a glowing track fill
function VolumeSlider({
  label,
  icon: Icon,
  value,
  onChange,
  color = "#3b82f6",
  unit = "%",
  min = 0,
  max = 100,
  step = 1,
  sublabel,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  sublabel?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const isActive = pct > 0;

  return (
    <div className="group space-y-2.5 p-3 rounded-2xl bg-neutral-900/40 border border-white/[0.04] hover:border-neutral-700 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm"
            style={{ backgroundColor: isActive ? `${color}25` : "#1a1a2e" }}
          >
            <Icon
              className="h-4 w-4 transition-colors duration-200"
              style={{ color: isActive ? color : "#6b7280" }}
            />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-100 tracking-wide">{label}</span>
            {sublabel && (
              <span className="block text-[10px] text-neutral-400 mt-0.5">{sublabel}</span>
            )}
          </div>
        </div>
        <div
          className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-xl transition-all duration-200 border"
          style={{
            color: isActive ? color : "#9ca3af",
            backgroundColor: isActive ? `${color}18` : "#181824",
            borderColor: isActive ? `${color}35` : "transparent",
          }}
        >
          {unit === "%" ? `${value}${unit}` : `${value}${unit}`}
        </div>
      </div>

      {/* Track & Interactive Range Slider */}
      <div className="relative h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: isActive ? `0 0 10px ${color}88` : "none",
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
          style={{ WebkitAppearance: "none" }}
        />
      </div>

      {/* Tick marks for percentage sliders */}
      {unit === "%" && (
        <div className="flex justify-between px-1">
          {[0, 25, 50, 75, 100].map((tick) => (
            <span key={tick} className="text-[9px] font-mono text-neutral-500">
              {tick}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Voice card selector
function VoiceCard({
  voice,
  isSelected,
  onSelect,
}: {
  voice: { code: string; label: string; gender?: "Male" | "Female"; lang?: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const parts = voice.label.split("—");
  const lang = voice.lang || parts[0]?.trim() || voice.label;
  const name = parts[1]?.trim() || parts[0]?.trim() || voice.code;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 relative group cursor-pointer hover:border-neutral-700"
      style={{
        borderColor: isSelected ? "#3b82f6" : "#1e1e2e",
        backgroundColor: isSelected ? "#3b82f618" : "#0d0d14",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isSelected ? "#3b82f633" : "#1a1a2e" }}
          >
            <Mic
              className="h-3.5 w-3.5"
              style={{ color: isSelected ? "#60a5fa" : "#6b7280" }}
            />
          </div>
          <div className="min-w-0">
            <div
              className="text-xs font-bold truncate leading-tight flex items-center gap-1.5"
              style={{ color: isSelected ? "#f3e8ff" : "#d1d5db" }}
            >
              <span>{name}</span>
              {voice.gender && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 font-mono">
                  {voice.gender}
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#3B82F6]/80 truncate mt-0.5">
              {lang} • <span className="font-mono text-neutral-500">{voice.code}</span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-[#2A2A2A] flex items-center justify-center flex-shrink-0 shadow-sm shadow-black/50">
            <Check className="h-3 w-3 text-white stroke-[3]" />
          </div>
        )}
      </div>
    </button>
  );
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
  enableDialogueAudio: propEnableDialogueAudio,
  setEnableDialogueAudio: propSetEnableDialogueAudio,
  enableNarrativeAudio: propEnableNarrativeAudio,
  setEnableNarrativeAudio: propSetEnableNarrativeAudio,
  onSave,
}: AudioSettingsPageProps) {
  const [internalEnableDialogueAudio, setInternalEnableDialogueAudio] = useState<boolean>(() =>
    localStorage.getItem("ai_comic_enable_dialogue_audio") === "true"
  );
  const [internalEnableNarrativeAudio, setInternalEnableNarrativeAudio] = useState<boolean>(() =>
    localStorage.getItem("ai_comic_enable_narrative_audio") !== "false"
  );

  const enableDialogueAudio = propEnableDialogueAudio !== undefined ? propEnableDialogueAudio : internalEnableDialogueAudio;
  const setEnableDialogueAudio = propSetEnableDialogueAudio || ((val: boolean) => {
    setInternalEnableDialogueAudio(val);
    localStorage.setItem("ai_comic_enable_dialogue_audio", String(val));
  });

  const enableNarrativeAudio = propEnableNarrativeAudio !== undefined ? propEnableNarrativeAudio : internalEnableNarrativeAudio;
  const setEnableNarrativeAudio = propSetEnableNarrativeAudio || ((val: boolean) => {
    setInternalEnableNarrativeAudio(val);
    localStorage.setItem("ai_comic_enable_narrative_audio", String(val));
  });

  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"mixer" | "voice" | "music">("mixer");
  const [availableVoices, setAvailableVoices] = useState<Array<{ code: string; label: string; gender?: "Male" | "Female"; lang?: string }>>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [voiceSearch, setVoiceSearch] = useState<string>("");
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [localNarratorVoice, setLocalNarratorVoice] = useState<string>(
    () => localStorage.getItem("ai_comic_narrator_voice") || "en-US-GuyNeural"
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("project_id") || propProjectId;
    if (id) setProjectId(id);
  }, [propProjectId]);

  useEffect(() => {
    let active = true;
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const fetchFn = fetchWithInterceptor || window.fetch.bind(window);
        const res = await fetchFn("/api/v1/audio/voices");
        const data = await res.json();
        if (active && data?.success && data?.voices) {
          setAvailableVoices(data.voices);
        }
      } catch {
        // fall through to defaults
      } finally {
        if (active) setLoadingVoices(false);
      }
    };
    loadVoices();
    return () => { active = false; };
  }, [fetchWithInterceptor]);

  const defaultVoices = DEFAULT_TTS_VOICES;
  const displayVoices = availableVoices.length > 0 ? availableVoices : defaultVoices;

  const distinctLanguages = useMemo(() => {
    const langs = new Set<string>();
    displayVoices.forEach((v) => {
      if (v.lang) {
        langs.add(v.lang);
      } else {
        const parts = v.label?.split("—");
        const langName = parts?.[0]?.split("(")?.[0]?.trim() || "English";
        langs.add(langName);
      }
    });
    const order = ["Tamil", "English", "Japanese", "Korean", "Spanish", "French", "German", "Chinese", "Hindi", "Telugu", "Kannada", "Malayalam"];
    const ordered = order.filter((l) => langs.has(l));
    const rest = Array.from(langs).filter((l) => !order.includes(l));
    return ["All", ...ordered, ...rest];
  }, [displayVoices]);

  const filteredVoices = useMemo(() => {
    return displayVoices.filter((v) => {
      const lang = v.lang || v.label?.split("—")?.[0]?.split("(")?.[0]?.trim() || "English";
      const matchLang = selectedLanguage === "All" || lang.toLowerCase() === selectedLanguage.toLowerCase() || v.label.toLowerCase().includes(selectedLanguage.toLowerCase());
      const query = voiceSearch.trim().toLowerCase();
      const matchQuery =
        !query ||
        v.label.toLowerCase().includes(query) ||
        v.code.toLowerCase().includes(query) ||
        (v.lang && v.lang.toLowerCase().includes(query));
      return matchLang && matchQuery;
    });
  }, [displayVoices, selectedLanguage, voiceSearch]);

  const handleSave = useCallback(async () => {
    localStorage.setItem("ai_comic_voice", voiceActor);
    localStorage.setItem("ai_comic_voice_actor", voiceActor);
    localStorage.setItem("ai_comic_narrator_voice", voiceActor);
    localStorage.setItem(
      "global_audio_settings",
      JSON.stringify({
        masterVolume: volume,
        volume,
        narrationVolume,
        bgmVolume,
        sfxVolume,
        speechRate,
        speechPitch,
        voiceActor,
        narratorVoice: voiceActor,
        musicTheme,
        audioDucking,
      })
    );

    const activeProjectData = useProjectStore.getState().activeProjectData;
    if (activeProjectData) {
      useProjectStore.getState().setActiveProject({
        ...activeProjectData,
        project: {
          ...activeProjectData.project,
          audio_settings: {
            volume,
            narrationVolume,
            bgmVolume,
            sfxVolume,
            speechRate,
            speechPitch,
            voiceActor,
            narratorVoice: voiceActor,
            musicTheme,
            audioDucking,
          },
        },
      });
    }

    if (onSave) {
      onSave();
    }

    const isTemp = !projectId || projectId.startsWith("temp_") || projectId.startsWith("draft_");
    if (isTemp) {
      if (addNotification) addNotification("Audio settings saved to workspace!", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem("ai_comic_enable_dialogue_audio", String(enableDialogueAudio));
      localStorage.setItem("ai_comic_enable_narrative_audio", String(enableNarrativeAudio));

      const fetchFn = fetchWithInterceptor || window.fetch.bind(window);
      const res = await fetchFn(`/api/v1/projects/${projectId}/settings/audio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_settings: {
            volume,
            narrationVolume,
            bgmVolume,
            sfxVolume,
            speechRate,
            speechPitch,
            voiceActor,
            narratorVoice: voiceActor,
            musicTheme,
            audioDucking,
            enableDialogueAudio,
            enableNarrativeAudio,
          },
        }),
      });
      const data = await res.json();
      if (data?.success) {
        if (addNotification) addNotification("Audio settings saved!", "success");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        throw new Error(data?.detail || "Save failed");
      }
    } catch (e: any) {
      if (addNotification) addNotification(`Save failed: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  }, [
    onSave,
    projectId,
    volume,
    narrationVolume,
    bgmVolume,
    sfxVolume,
    speechRate,
    speechPitch,
    voiceActor,
    musicTheme,
    audioDucking,
    addNotification,
    fetchWithInterceptor,
  ]);

  const tabs = [
    { id: "mixer", label: "Mixer", icon: Sliders },
    { id: "voice", label: "Voice & TTS", icon: Mic },
    { id: "music", label: "Soundtrack", icon: Music },
  ] as const;

  const currentVoiceObj = useMemo(() => {
    return (
      displayVoices.find((v) => v.code === voiceActor) ||
      displayVoices.find((v) => v.code.toLowerCase() === voiceActor?.toLowerCase()) ||
      displayVoices.find((v) => v.code === "en-US-ChristopherNeural") ||
      displayVoices[0]
    );
  }, [displayVoices, voiceActor]);

  useEffect(() => {
    if (voiceActor && voiceActor !== localNarratorVoice) {
      setLocalNarratorVoice(voiceActor);
    }
  }, [voiceActor, localNarratorVoice]);

  useEffect(() => {
    if (!voiceActor && currentVoiceObj?.code) {
      setVoiceActor(currentVoiceObj.code);
    }
  }, [voiceActor, currentVoiceObj, setVoiceActor]);

  return (
    <div className={isEmbed ? "w-full" : "w-full max-w-4xl mx-auto py-4"}>

      {/* ── Tab Bar Navigation ────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-neutral-900 rounded-2xl border border-neutral-800 w-fit shadow-md">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  color: isActive ? "#fff" : "#6b7280",
                  background: isActive
                    ? "linear-gradient(135deg, #7c3aed22 0%, #4f46e522 100%)"
                    : "transparent",
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
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* MIXER TAB */}
        {activeTab === "mixer" && (
          <div
            className="rounded-2xl border p-6 space-y-6"
            style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
          >
            {/* Section header */}
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-xl bg-[#2A2A2A] flex items-center justify-center">
                <Sliders className="h-4 w-4 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Volume Mixer</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Balance each output pipeline independently
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <VolumeSlider
                label="Master Output"
                sublabel="Overall output gain across all channels"
                icon={Volume2}
                value={volume}
                onChange={setVolume}
                color="#3b82f6"
              />
              <VolumeSlider
                label="Narration / Voice Track"
                sublabel="TTS dialogue & character voice lines"
                icon={Mic}
                value={narrationVolume}
                onChange={setNarrationVolume}
                color="#8b5cf6"
              />
              <VolumeSlider
                label="Background Music"
                sublabel="Thematic BGM loop level"
                icon={Music}
                value={bgmVolume}
                onChange={setBgmVolume}
                color="#6366f1"
              />
              <VolumeSlider
                label="Sound Effects"
                sublabel="Atmospheric SFX & ambient layers"
                icon={Volume1}
                value={sfxVolume}
                onChange={setSfxVolume}
                color="#4f46e5"
              />
            </div>

            {/* Quick preview strip */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ backgroundColor: "#0d0d1a", borderColor: "#1e1e30" }}
            >
              <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
              <p className="text-[11px] text-neutral-400">
                <span className="text-neutral-200 font-semibold">Auto-Ducking</span>{" "}
                is{" "}
                <span
                  className="font-semibold"
                  style={{ color: audioDucking ? "#3b82f6" : "#6b7280" }}
                >
                  {audioDucking ? "enabled" : "disabled"}
                </span>
                {" "}— BGM will {audioDucking ? "drop automatically" : "stay constant"} during dialogue.
              </p>
              <button
                onClick={() => setAudioDucking(!audioDucking)}
                className="ml-auto flex-shrink-0 relative inline-flex h-5 w-10 rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none"
                style={{ backgroundColor: audioDucking ? "#7c3aed" : "#374151" }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
                  style={{ transform: audioDucking ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>
        )}

        {/* VOICE TAB */}
        {activeTab === "voice" && (
          <div className="space-y-4">
            {/* Audio Generation Controls: Dialogues vs Narratives */}
            <div
              className="rounded-2xl border p-5 space-y-4 shadow-lg shadow-black/20"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Audio Generation Modes
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      TTS Synthesis
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Choose what audio gets automatically synthesized during storyboard analysis
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Narratives Audio Switch (Default: ON) */}
                <div
                  className="p-4 rounded-xl border flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: enableNarrativeAudio ? "rgba(99, 102, 241, 0.08)" : "#0d0d1a",
                    borderColor: enableNarrativeAudio ? "rgba(99, 102, 241, 0.4)" : "#1e1e30",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: enableNarrativeAudio ? "rgba(99, 102, 241, 0.2)" : "#1a1a2e",
                        color: enableNarrativeAudio ? "#818cf8" : "#6b7280",
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Recap Narratives Voice</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                          Default ON
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        Synthesizes cinematic third-person YouTube manga recap voiceover narration for each panel.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnableNarrativeAudio(!enableNarrativeAudio)}
                    className="ml-4 flex-shrink-0 relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-all duration-200 cursor-pointer focus:outline-none"
                    style={{ backgroundColor: enableNarrativeAudio ? "#6366f1" : "#374151" }}
                  >
                    <span
                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
                      style={{ transform: enableNarrativeAudio ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>

                {/* Dialogues Audio Switch (Default: OFF) */}
                <div
                  className="p-4 rounded-xl border flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: enableDialogueAudio ? "rgba(59, 130, 246, 0.08)" : "#0d0d1a",
                    borderColor: enableDialogueAudio ? "rgba(59, 130, 246, 0.4)" : "#1e1e30",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: enableDialogueAudio ? "rgba(59, 130, 246, 0.2)" : "#1a1a2e",
                        color: enableDialogueAudio ? "#60a5fa" : "#6b7280",
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Character Dialogues Voice</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                          Optional (OFF)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        Synthesizes character speech bubble lines with character-assigned voice casting.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnableDialogueAudio(!enableDialogueAudio)}
                    className="ml-4 flex-shrink-0 relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-all duration-200 cursor-pointer focus:outline-none"
                    style={{ backgroundColor: enableDialogueAudio ? "#3b82f6" : "#374151" }}
                  >
                    <span
                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
                      style={{ transform: enableDialogueAudio ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Unified AI Voice Actor Dropdown Card */}
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6]/30 to-indigo-600/30 border border-[#3B82F6]/40 flex items-center justify-center">
                    <Mic className="h-4 w-4 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Voice Actor</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Unified neural voice model for character dialogues, speech & narration
                    </p>
                  </div>
                </div>
                {loadingVoices && (
                  <div className="h-4 w-4 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
                )}
              </div>

              {/* Selected Voice Trigger Button */}
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-750 bg-neutral-900/90 hover:bg-neutral-850 hover:border-neutral-700 transition-all cursor-pointer group shadow-sm text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] shrink-0 font-mono font-bold text-xs">
                    {currentVoiceObj?.gender === "Female" ? "♀" : "♂"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {currentVoiceObj?.label?.split("—")?.[1]?.trim() ||
                          currentVoiceObj?.label?.split("—")?.[0]?.trim() ||
                          voiceActor ||
                          "Select a voice"}
                      </span>
                      {currentVoiceObj?.lang && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] font-medium">
                          {currentVoiceObj?.lang}
                        </span>
                      )}
                      {currentVoiceObj?.gender && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                          {currentVoiceObj?.gender}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                      {voiceActor || currentVoiceObj?.code}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors">
                    {isVoiceDropdownOpen ? "Close" : "Select Voice"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200 ${
                      isVoiceDropdownOpen ? "rotate-180 text-[#60A5FA]" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expandable Dropdown Menu with Filter & Search */}
              {isVoiceDropdownOpen && (
                <div className="space-y-3 pt-3 border-t border-neutral-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Language Filter & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Language Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
                      {distinctLanguages.map((lang) => {
                        const isSelected = selectedLanguage === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setSelectedLanguage(lang)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer"
                            style={{
                              backgroundColor: isSelected ? "#3b82f6" : "#141420",
                              color: isSelected ? "#ffffff" : "#9ca3af",
                              border: `1px solid ${isSelected ? "#3b82f6" : "#222233"}`,
                            }}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-56 shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={voiceSearch}
                        onChange={(e) => setVoiceSearch(e.target.value)}
                        placeholder="Search voice or dialect..."
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-xl pl-8.5 pr-3 py-1.5 text-white placeholder-neutral-500 focus:border-neutral-600 outline-none"
                      />
                      {voiceSearch && (
                        <button
                          type="button"
                          onClick={() => setVoiceSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Voice Grid List */}
                  {filteredVoices.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-950/60 rounded-xl border border-neutral-800">
                      No voice matches &quot;{voiceSearch}&quot; in {selectedLanguage}.
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/80"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "#3b82f6 transparent" }}
                    >
                      {filteredVoices.map((voice) => (
                        <VoiceCard
                          key={voice.code}
                          voice={voice}
                          isSelected={voiceActor === voice.code || (!voiceActor && currentVoiceObj?.code === voice.code)}
                          onSelect={() => {
                            setVoiceActor(voice.code);
                            setLocalNarratorVoice(voice.code);
                            localStorage.setItem("ai_comic_voice", voice.code);
                            localStorage.setItem("ai_comic_voice_actor", voice.code);
                            localStorage.setItem("ai_comic_narrator_voice", voice.code);
                            try {
                              const raw = localStorage.getItem("global_audio_settings");
                              const parsed = raw ? JSON.parse(raw) : {};
                              parsed.voiceActor = voice.code;
                              parsed.narratorVoice = voice.code;
                              localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
                            } catch {}

                            const activeProjectData = useProjectStore.getState().activeProjectData;
                            if (activeProjectData) {
                              useProjectStore.getState().setActiveProject({
                                ...activeProjectData,
                                project: {
                                  ...activeProjectData.project,
                                  audio_settings: {
                                    ...(activeProjectData.project.audio_settings || {}),
                                    volume,
                                    narrationVolume,
                                    bgmVolume,
                                    sfxVolume,
                                    speechRate,
                                    speechPitch,
                                    voiceActor: voice.code,
                                    narratorVoice: voice.code,
                                    musicTheme,
                                    audioDucking,
                                  },
                                },
                              });
                            }
                            setIsVoiceDropdownOpen(false);
                            if (addNotification) {
                              addNotification(`Selected voice: ${voice.label || voice.code}`, "info");
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Speech Rate & Pitch */}
            <div
              className="rounded-2xl border p-6 space-y-5"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Speech Properties</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Tune delivery speed and vocal resonance
                  </p>
                </div>
              </div>

              <VolumeSlider
                label="Speech Rate (Speed)"
                icon={ChevronRight}
                value={speechRate}
                onChange={setSpeechRate}
                color="#8b5cf6"
                unit="x"
                min={0.5}
                max={2.0}
                step={0.1}
              />
              <VolumeSlider
                label="Pitch Frequency"
                icon={AudioWaveform}
                value={speechPitch}
                onChange={setSpeechPitch}
                color="#6366f1"
                unit="x"
                min={0.5}
                max={2.0}
                step={0.1}
              />
            </div>
          </div>
        )}

        {/* MUSIC TAB */}
        {activeTab === "music" && (
          <div className="space-y-4">
            {/* Theme picker */}
            <div
              className="rounded-2xl border p-6 space-y-5"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Disc className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Soundtrack Theme</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Choose the atmospheric BGM loop for this chapter
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {MUSIC_THEMES.map((theme) => {
                  const isSelected = musicTheme === theme.label;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setMusicTheme(theme.label)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
                      style={{
                        borderColor: isSelected ? "#6366f1" : "#1e1e30",
                        backgroundColor: isSelected ? "#6366f110" : "#0d0d1a",
                      }}
                    >
                      <span className="text-lg">{theme.icon}</span>
                      <div className="text-left flex-1">
                        <div
                          className="text-xs font-semibold"
                          style={{ color: isSelected ? "#e2e8f0" : "#9ca3af" }}
                        >
                          {theme.label}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Mood: {theme.mood}
                        </div>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: isSelected ? "#6366f1" : "#374151",
                          backgroundColor: isSelected ? "#6366f1" : "transparent",
                        }}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ducking Card */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Intelligent Audio Ducking</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Auto-reduce BGM volume during spoken dialogue
                  </p>
                </div>
                <button
                  onClick={() => setAudioDucking(!audioDucking)}
                  className="ml-auto relative inline-flex h-6 w-12 rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none"
                  style={{ backgroundColor: audioDucking ? "#7c3aed" : "#374151" }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
                    style={{ transform: audioDucking ? "translateX(24px)" : "translateX(0px)" }}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Dialogue Detection", value: "Whisper STT", active: audioDucking },
                  { label: "Duck Amount", value: "−12 dB", active: audioDucking },
                  { label: "Attack Time", value: "80 ms", active: audioDucking },
                  { label: "Release Time", value: "320 ms", active: audioDucking },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-2.5 rounded-xl border"
                    style={{
                      borderColor: stat.active ? "#7c3aed44" : "#1e1e30",
                      backgroundColor: stat.active ? "#7c3aed0a" : "#0d0d1a",
                    }}
                  >
                    <div className="text-[10px] text-neutral-500 mb-1">{stat.label}</div>
                    <div
                      className="text-xs font-bold font-mono"
                      style={{ color: stat.active ? "#c4b5fd" : "#6b7280" }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Save Footer ────────────────────────────────────────────────── */}
      <div
        className="mt-5 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border"
        style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: saved ? "#22c55e" : "#7c3aed",
              boxShadow: saved ? "0 0 8px #22c55e99" : "0 0 8px #7c3aed99",
            }}
          />
          <span className="text-[11px] text-neutral-500 truncate">
            {saved
              ? "All settings saved successfully!"
              : projectId
              ? `Audio matrix for: "${projectId}"`
              : "Global fallback audio profile"}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 flex-shrink-0 disabled:opacity-40"
          style={{
            background: saved
              ? "linear-gradient(135deg, #16a34a, #15803d)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: saved
              ? "0 0 16px #16a34a44"
              : "0 0 16px #7c3aed44",
          }}
        >
          {saved ? (
            <><Check className="h-3.5 w-3.5" /> Saved!</>
          ) : saving ? (
            <><div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-3.5 w-3.5" /> Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}

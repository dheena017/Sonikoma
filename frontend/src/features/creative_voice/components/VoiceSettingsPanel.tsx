import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  Users,
  Volume2,
  Wand2,
  RefreshCw,
  BookmarkCheck,
  Play,
  Square,
} from "lucide-react";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";
import { GeneratedPanel } from "@/types";

interface VoiceSettingsPanelProps {
  activePanel?: GeneratedPanel;
  selectedIdx?: number;
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification?: (msg: string, type: any) => void;
}

interface CastResult {
  suggested_actor: string;
  tone_description: string;
  match_confidence: number;
}

import { DEFAULT_TTS_VOICES, TTSVoiceOption } from "@/features/editor_studio/types/settings";

type VoiceOption = TTSVoiceOption;
const DEFAULT_VOICES: VoiceOption[] = DEFAULT_TTS_VOICES;

export default function VoiceSettingsPanel({
  activePanel,
  selectedIdx = 0,
  setPanels,
  addNotification,
}: VoiceSettingsPanelProps) {
  const panelNumber = selectedIdx + 1;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(
    activePanel?.character_name || activePanel?.speaker_name || ""
  );
  const [dialogue, setDialogue] = useState(activePanel?.speech_text || "");
  const [visual, setVisual] = useState(activePanel?.visual_description || "");
  const [castData, setCastData] = useState<CastResult | null>(null);

  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState("en-US-GuyNeural");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [testScript, setTestScript] = useState(activePanel?.speech_text || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state when activePanel changes
  useEffect(() => {
    if (activePanel) {
      setName(activePanel.character_name || activePanel.speaker_name || "");
      setDialogue(activePanel.speech_text || "");
      setTestScript(activePanel.speech_text || "");
      setVisual(activePanel.visual_description || "");
    }
  }, [activePanel]);

  useEffect(() => {
    api
      .getVoices(fetch)
      .then((data) => {
        if (data.success && data.voices) {
          const mapped = data.voices.map((v: any) => ({
            ...v,
            gender: v.label?.toLowerCase().includes("female")
              ? "Female"
              : "Male",
            lang: v.label?.split(" ")[0] || "English",
          }));
          setVoices(mapped);
        }
      })
      .catch((e) =>
        console.warn("Failed to fetch voices list, using defaults.", e)
      );

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setTestScript(dialogue);
  }, [dialogue]);

  const handleCast = async () => {
    setLoading(true);
    try {
      const json = await api.runVoiceCastSkill(fetchWithAuth, {
        character_name: name,
        dialogue_sample: dialogue,
        visual_description: visual,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setCastData(json.result);
        addNotification?.("Character voice recommendation parsed!", "success");

        const suggested = json.result.suggested_actor?.toLowerCase() || "";
        const matchingVoice = voices.find(
          (v) =>
            suggested.includes(v.code.toLowerCase()) ||
            suggested.includes(v.label.toLowerCase()) ||
            v.label.toLowerCase().includes(suggested)
        );
        if (matchingVoice) {
          setSelectedVoice(matchingVoice.code);
        }
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Voice casting search encountered an issue", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVoice = () => {
    if (!setPanels || !activePanel) {
      addNotification?.("Voice profile selected: " + selectedVoice, "info");
      return;
    }

    setPanels((prev) =>
      prev.map((p) =>
        p.id === activePanel.id ? { ...p, voice: selectedVoice } : p
      )
    );
    addNotification?.(
      `Assigned voice ${selectedVoice} to Panel #${panelNumber}!`,
      "success"
    );
  };

  const handlePreviewToggle = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    setIsGenerating(true);
    try {
      const words = testScript.trim().split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(
        2.0,
        parseFloat((words / 2.2 + 0.8).toFixed(1))
      );

      const json = await api.generateAudio(fetchWithAuth, {
        dialogue_list: [testScript],
        target_duration: estimatedDuration,
        voice: selectedVoice,
        return_base64: true,
      });

      if (json.success && json.audio_base64) {
        const audioSrc = `data:${json.mime_type || "audio/mpeg"};base64,${
          json.audio_base64
        }`;
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
        };

        audio.onerror = (err) => {
          console.error("HTML5 Audio playback error:", err);
          setIsPlaying(false);
          addNotification?.("Failed to play audio preview", "error");
        };

        setIsPlaying(true);
        await audio.play();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(testScript);
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        setIsPlaying(true);
        window.speechSynthesis.speak(utter);
      }
    } catch (e: any) {
      console.error(e);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(testScript);
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        setIsPlaying(true);
        window.speechSynthesis.speak(utter);
      } else {
        addNotification?.(
          e.message || "Failed to generate voice preview",
          "error"
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredVoices = voices.filter((v) => {
    if (filterCategory === "Male") return v.gender === "Male";
    if (filterCategory === "Female") return v.gender === "Female";
    if (filterCategory === "English") return v.code.startsWith("en-");
    if (filterCategory === "Korean/Japanese")
      return v.code.startsWith("ko-") || v.code.startsWith("ja-");
    return true;
  });

  return (
    <div className="space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2F2F2F] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl text-[#3B82F6]">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-mono font-bold text-[#E5E5E5] uppercase tracking-wider">
              Voice Actor Casting & Matching
            </h4>
            <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
              Match AI voice actors based on character personality, appearance
              description, and dialogue tone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCast}
            disabled={loading || !name}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
            <span>{loading ? "Matching..." : "✦ AI Cast Match"}</span>
          </button>

          {setPanels && (
            <button
              onClick={handleAssignVoice}
              className="px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white border border-[#10B981]/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 active:scale-95"
              title="Assign selected voice to active panel"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-white" />
              <span>Assign to Panel #{panelNumber}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* CHARACTER & DIALOGUE INPUT FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-widest block font-bold">
              CHARACTER NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jinwoo / Shadow Sovereign"
              className="w-full bg-[#121212] border border-[#2F2F2F] text-xs rounded-xl p-2.5 text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-all font-sans font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-widest block font-bold">
              DIALOGUE SAMPLE
            </label>
            <input
              type="text"
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              placeholder="e.g. Prepare to perish."
              className="w-full bg-[#121212] border border-[#2F2F2F] text-xs rounded-xl p-2.5 text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-all font-sans font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-widest block font-bold">
            VISUAL APPEARANCE DESCRIPTION
          </label>
          <textarea
            rows={2}
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
            placeholder="Describe character's gender, style, aura, look..."
            className="w-full bg-[#121212] border border-[#2F2F2F] text-xs rounded-xl p-2.5 text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-all font-sans font-medium leading-relaxed"
          />
        </div>

        {/* AI RECOMMENDED CAST RESULT BANNER */}
        {castData && !loading && (
          <div className="bg-[#121212] p-4 rounded-xl border border-[#2F2F2F] space-y-2.5 animate-fade-in shadow-md">
            <div className="flex justify-between items-center border-b border-[#2F2F2F] pb-2">
              <span className="text-[10px] font-mono text-[#3B82F6] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" /> AI
                Recommended Voice Actor Match
              </span>
              <span className="text-[9px] font-mono bg-[#3B82F6]/15 text-[#3B82F6] px-2 py-0.5 border border-[#3B82F6]/30 rounded-full font-bold">
                Confidence:{" "}
                {Math.round((castData.match_confidence || 0.9) * 100)}%
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center font-bold text-base text-[#3B82F6] uppercase shrink-0 shadow-sm">
                {castData.suggested_actor?.charAt(0) || "V"}
              </div>
              <div className="space-y-1 flex-1">
                <h5 className="text-xs font-bold text-[#E5E5E5] font-sans">
                  {castData.suggested_actor || "Male Deep Hero"}
                </h5>
                <p className="text-[11px] font-sans text-[#9CA3AF] leading-relaxed">
                  {castData.tone_description ||
                    "A deep, authoritative resonance that commands presence, suitable for main protagonists with mysterious powers."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LIVE VOICE TESTER & CATEGORY FILTER */}
        <div className="border-t border-[#2F2F2F] pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
              <h5 className="text-[10px] font-mono font-bold text-[#E5E5E5] uppercase tracking-wider">
                Voice Actor Selection & Live Synthesis Tester
              </h5>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono">
              {["All", "Male", "Female", "English", "Korean/Japanese"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border cursor-pointer whitespace-nowrap ${
                      filterCategory === cat
                        ? "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/40 shadow-sm"
                        : "bg-[#121212] text-[#9CA3AF] border-[#2F2F2F] hover:text-white hover:border-[#3B82F6]/60"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-widest block font-bold">
                SELECT VOICE ACTOR
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-[#121212] border border-[#2F2F2F] text-xs rounded-xl p-2.5 text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-all font-sans cursor-pointer"
              >
                {filteredVoices.map((v) => (
                  <option
                    key={v.code}
                    value={v.code}
                    className="bg-[#121212] text-[#E5E5E5]"
                  >
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-widest block font-bold">
                TEST DIALOGUE SCRIPT
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={testScript}
                  onChange={(e) => setTestScript(e.target.value)}
                  placeholder="Type preview dialogue..."
                  className="w-full bg-[#121212] border border-[#2F2F2F] text-xs rounded-xl p-2.5 pr-24 text-[#E5E5E5] outline-none focus:border-[#3B82F6] transition-all font-sans font-medium"
                />
                <button
                  onClick={handlePreviewToggle}
                  disabled={isGenerating || !testScript}
                  className="absolute right-1.5 px-3 py-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-40 text-white rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> Play
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sound Wave Visualizer when playing preview */}
          {isPlaying && (
            <div className="flex items-center justify-between bg-[#121212] border border-[#2F2F2F] rounded-xl p-3 animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#3B82F6] animate-pulse" />
                <span className="text-[10px] font-mono text-[#E5E5E5] font-bold">
                  Synthesizing &amp; Playing Audio Preview ({selectedVoice})...
                </span>
              </div>
              <div className="flex items-end gap-1 h-4">
                <span
                  className="w-1 bg-[#3B82F6] rounded-full animate-bounce h-3"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-1 bg-[#3B82F6] rounded-full animate-bounce h-4"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-1 bg-[#3B82F6] rounded-full animate-bounce h-2"
                  style={{ animationDelay: "0.3s" }}
                />
                <span
                  className="w-1 bg-[#3B82F6] rounded-full animate-bounce h-3.5"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

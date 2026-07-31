import React, { useState } from "react";
import { Sparkles, Check, Users, ShieldAlert } from "lucide-react";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";

interface VoiceSettingsPanelProps {
  addNotification?: (msg: string, type: any) => void;
}

interface CastResult {
  suggested_actor: string;
  tone_description: string;
  match_confidence: number;
}

interface VoiceOption {
  code: string;
  label: string;
}

const DEFAULT_VOICES: VoiceOption[] = [
  { code: "en-US-GuyNeural", label: "English (US) — Guy (Male)" },
  { code: "en-US-JennyNeural", label: "English (US) — Jenny (Female)" },
  { code: "en-US-AriaNeural", label: "English (US) — Aria (Female)" },
  { code: "en-GB-SoniaNeural", label: "English (UK) — Sonia (Female)" },
  { code: "en-GB-RyanNeural", label: "English (UK) — Ryan (Male)" },
  { code: "en-AU-NatashaNeural", label: "English (AU) — Natasha (Female)" },
  { code: "ko-KR-SunHiNeural", label: "Korean — SunHi (Female)" },
  { code: "ko-KR-InJoonNeural", label: "Korean — InJoon (Male)" },
  { code: "ja-JP-NanamiNeural", label: "Japanese — Nanami (Female)" },
  {
    code: "zh-CN-XiaoxiaoNeural",
    label: "Chinese (Mandarin) — Xiaoxiao (Female)",
  },
  { code: "ta-IN-PallaviNeural", label: "Tamil (India) — Pallavi (Female)" },
  { code: "ta-IN-ValluvarNeural", label: "Tamil (India) — Valluvar (Male)" },
];

export default function VoiceSettingsPanel({
  addNotification,
}: VoiceSettingsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("Shadow Sovereign");
  const [dialogue, setDialogue] = useState(
    "Arise. The darkness answers only to me."
  );
  const [visual, setVisual] = useState(
    "Tall male with glowing violet eyes, clad in midnight black armor radiating shadows."
  );
  const [castData, setCastData] = useState<CastResult | null>(null);

  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState("en-US-GuyNeural");
  const [testScript, setTestScript] = useState(
    "Arise. The darkness answers only to me."
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    api
      .getVoices(fetch)
      .then((data) => {
        if (data.success && data.voices) {
          setVoices(data.voices);
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

  React.useEffect(() => {
    setTestScript(dialogue);
  }, [dialogue]);

  const handleCast = async () => {
    setLoading(true);
    try {
      const json = await api.runVoiceCastSkill(fetchWithAuth, {
        character_name: name,
        dialogue_sample: dialogue,
        visual_description: visual,
        model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
      });
      if (json.success && json.result) {
        setCastData(json.result);
        if (addNotification) {
          addNotification("Character voice recommendation parsed!", "success");
        }

        // Auto-select recommended voice code if it matches any of the labels or codes
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
      if (addNotification) {
        addNotification("Voice casting search encountered an issue", "error");
      }
    } finally {
      setLoading(false);
    }
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
      // Estimate duration based on word count to keep text and audio matched
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
          if (addNotification) {
            addNotification("Failed to play audio preview", "error");
          }
        };

        setIsPlaying(true);
        await audio.play();
      } else {
        throw new Error(json.error || "Failed to generate preview audio");
      }
    } catch (e: any) {
      console.error(e);
      if (addNotification) {
        addNotification(
          e.message || "Failed to generate voice preview",
          "error"
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Voice Casting Selector
          </h4>
        </div>
        <button
          onClick={handleCast}
          disabled={loading || !name}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Searching profiles..." : "✦ Cast Voice"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jinwoo"
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">
              Dialogue Sample
            </label>
            <input
              type="text"
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              placeholder="e.g. Prepare to perish."
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">
            Visual Appearance Description
          </label>
          <textarea
            rows={2}
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
            placeholder="Describe character's gender, style, aura, look..."
            className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
          />
        </div>

        {castData && !loading && (
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
              <span className="text-[9px] font-mono text-purple-355 uppercase font-bold">
                Recommended Voice Cast:
              </span>
              <span className="text-[9px] font-mono bg-purple-950/40 text-purple-400 px-2 py-0.5 border border-purple-800/40 rounded-full">
                Confidence:{" "}
                {Math.round((castData.match_confidence || 0.9) * 100)}%
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-900/25 border border-purple-800/40 flex items-center justify-center font-bold text-sm text-purple-300 uppercase">
                {castData.suggested_actor?.charAt(0) || "V"}
              </div>
              <div className="space-y-1 flex-1">
                <h5 className="text-xs font-bold text-white font-sans">
                  {castData.suggested_actor || "Male Deep Hero"}
                </h5>
                <p className="text-[11px] font-sans text-neutral-350 leading-relaxed">
                  {castData.tone_description ||
                    "A deep, authoritative resonance that commands presence, suitable for main protagonists with mysterious powers."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Voice Testing Lab */}
        <div className="border-t border-neutral-800/60 pt-4 mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <h5 className="text-[10px] font-mono font-bold text-neutral-350 uppercase tracking-wider">
              Live Preview & Voice Tester
            </h5>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-neutral-500 uppercase">
                Voice Actor
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-650 transition-all font-sans cursor-pointer"
              >
                {voices.map((v) => (
                  <option
                    key={v.code}
                    value={v.code}
                    className="bg-neutral-950"
                  >
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-neutral-500 uppercase">
                Test Dialogue Script
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={testScript}
                  onChange={(e) => setTestScript(e.target.value)}
                  placeholder="Type preview dialogue..."
                  className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 pr-20 text-neutral-350 outline-none focus:border-purple-650 transition-all font-sans"
                />
                <button
                  onClick={handlePreviewToggle}
                  disabled={isGenerating || !testScript}
                  className="absolute right-1.5 px-3 py-1 bg-purple-650 hover:bg-purple-550 disabled:opacity-40 text-white rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isGenerating ? (
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : isPlaying ? (
                    <>⏸ Stop</>
                  ) : (
                    <>▶ Play</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Premium sound visualizer animation */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-1 bg-purple-950/20 border border-purple-900/30 rounded-xl p-2.5 animate-fade-in">
              <span className="text-[10px] font-mono text-purple-400 mr-2">
                Synthesizing & Playing Preview...
              </span>
              <div className="flex items-end gap-0.5 h-3">
                <span
                  className="w-0.5 bg-purple-400 rounded-full animate-bounce h-2"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-0.5 bg-purple-400 rounded-full animate-bounce h-3"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-0.5 bg-purple-400 rounded-full animate-bounce h-1.5"
                  style={{ animationDelay: "0.3s" }}
                />
                <span
                  className="w-0.5 bg-purple-400 rounded-full animate-bounce h-2.5"
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

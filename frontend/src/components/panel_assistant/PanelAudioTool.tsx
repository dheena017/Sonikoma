import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface PanelAudioToolProps {
  panel: GeneratedPanel;
}

interface SfxData {
  audio_prompt: string;
  suggested_volume: number;
}

interface VoiceData {
  gender: string;
  suggested_age: string;
  voice_tone: string;
  speech_tempo: number;
  accent: string;
}

export default function PanelAudioTool({ panel }: PanelAudioToolProps) {
  const [loadingSfx, setLoadingSfx] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [sfxData, setSfxData] = useState<SfxData | null>(null);
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerateSfx = async () => {
    setLoadingSfx(true);
    try {
      const res = await fetch("/api/skills/sfx-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Action scene panel",
          sfx_tag: panel.sfx || "[Action]",
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setSfxData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSfx(false);
    }
  };

  const handleGenerateVoice = async () => {
    setLoadingVoice(true);
    try {
      const res = await fetch("/api/skills/voice-cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_name: "Protagonist",
          dialogue_sample: panel.speech_text || "Stop right there!",
          visual_description:
            panel.visual_description || "Action scene character close-up",
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setVoiceData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVoice(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sound Effect Synth Prompter */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">
            AI Sound Design Synthesis Prompt
          </h5>
          <button
            onClick={handleGenerateSfx}
            disabled={loadingSfx || !panel.sfx}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingSfx ? "Designing..." : "✦ Suggest prompt"}
          </button>
        </div>

        {loadingSfx && (
          <div className="text-center py-6 animate-pulse text-[10px] font-mono text-purple-450">
            Synthesizing audio descriptor tags...
          </div>
        )}

        {sfxData && !loadingSfx && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 animate-fade-in">
            <div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase block">
                Audio Generator Prompt:
              </span>
              <p className="text-[11px] font-sans text-neutral-350 leading-relaxed font-semibold italic">
                "{sfxData.audio_prompt}"
              </p>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
              <span>Suggested Mix Volume:</span>
              <span className="text-purple-400 font-bold">
                {(sfxData.suggested_volume * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TTS voice casting parameters */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">
            AI Voice Actor Casting Parameters
          </h5>
          <button
            onClick={handleGenerateVoice}
            disabled={loadingVoice || !panel.speech_text}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingVoice ? "Casting..." : "✦ Scan Voice"}
          </button>
        </div>

        {loadingVoice && (
          <div className="text-center py-6 animate-pulse text-[10px] font-mono text-purple-450">
            Analyzing dialogue pitch & tempo metrics...
          </div>
        )}

        {voiceData && !loadingVoice && (
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2 text-[10px] font-mono animate-fade-in">
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Gender profile</span>
                <span className="text-neutral-300 font-semibold">
                  {voiceData.gender}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Target age group</span>
                <span className="text-neutral-300 font-semibold">
                  {voiceData.suggested_age}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Dialogue tempo</span>
                <span className="text-neutral-300 font-semibold">
                  {voiceData.speech_tempo}x
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1">
                <span className="text-neutral-500">Speech accent</span>
                <span className="text-neutral-300 font-semibold">
                  {voiceData.accent}
                </span>
              </div>
              <div className="col-span-2 pt-1">
                <span className="text-neutral-500 block">
                  Tonal quality descriptions:
                </span>
                <span className="text-purple-300 font-semibold mt-0.5 block">
                  {voiceData.voice_tone}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

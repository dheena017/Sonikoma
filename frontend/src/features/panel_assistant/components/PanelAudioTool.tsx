import React, { useState } from "react";
import { Sparkles, Copy, Check, Layers3 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";

interface PanelAudioToolProps {
  panel: GeneratedPanel;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
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

export default function PanelAudioTool({ panel, panels, addNotification }: PanelAudioToolProps) {
  const [loadingSfx, setLoadingSfx] = useState(false);
  const [batchSfxLoading, setBatchSfxLoading] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [batchVoiceLoading, setBatchVoiceLoading] = useState(false);
  const [sfxData, setSfxData] = useState<SfxData | null>(null);
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerateSfx = async () => {
    setLoadingSfx(true);
    try {
      const json = await api.runSfxAudioSkill(fetchWithAuth, {
        visual_description: panel.visual_description || "Action scene panel",
        sfx_tag: panel.sfx || "[Action]",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
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
      const json = await api.runVoiceCastSkill(fetchWithAuth, {
        character_name: "Protagonist",
        dialogue_sample: panel.speech_text || "Stop right there!",
        visual_description:
          panel.visual_description || "Action scene character close-up",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setVoiceData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVoice(false);
    }
  };

  const handleBatchGenerateSfx = async () => {
    if (!panels?.length) return;
    setBatchSfxLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runSfxAudioSkill(fetchWithAuth, {
              visual_description: panelItem.visual_description || "Action scene panel",
              sfx_tag: panelItem.sfx || "[Action]",
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated sound prompts for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchSfxLoading(false);
    }
  };

  const handleBatchGenerateVoice = async () => {
    if (!panels?.length) return;
    setBatchVoiceLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runVoiceCastSkill(fetchWithAuth, {
              character_name: "Protagonist",
              dialogue_sample: panelItem.speech_text || "Stop right there!",
              visual_description:
                panelItem.visual_description || "Action scene character close-up",
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated voice profiles for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchVoiceLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-purple-300">
              Audio direction
            </h5>
            <p className="mt-1 text-sm text-neutral-400">
              Shape the soundscape and voice profile for this panel.
            </p>
          </div>
          <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
            TTS ready
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Sound design prompt
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSfx}
                disabled={loadingSfx || !panel.sfx}
                title="Generate SFX prompt for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingSfx ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGenerateSfx}
                disabled={batchSfxLoading || !panels?.length}
                title="Generate SFX prompts for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchSfxLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
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

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Voice casting profile
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateVoice}
                disabled={loadingVoice || !panel.speech_text}
                title="Generate voice profile for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingVoice ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGenerateVoice}
                disabled={batchVoiceLoading || !panels?.length}
                title="Generate voice profiles for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchVoiceLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
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
    </div>
  );
}

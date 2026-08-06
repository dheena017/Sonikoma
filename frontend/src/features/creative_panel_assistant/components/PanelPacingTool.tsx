import React, { useState } from "react";
import { Sparkles, Copy, Check, Layers3 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import * as api from "@/api";
import { fetchWithAuth } from "@/utils";

interface PanelPacingToolProps {
  panel: GeneratedPanel;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface PacingData {
  duration_multiplier: number;
  transition_speed_sec: number;
  bgm_volume_dampen: number;
}

interface TransitionData {
  transition_style: string;
  duration_frames: number;
  pacing_rationale: string;
}

interface ShakeData {
  shake_amplitude: number;
  shake_frequency: number;
  ffmpeg_offset_formula: string;
}

export default function PanelPacingTool({ panel, panels, addNotification }: PanelPacingToolProps) {
  const [loadingPacing, setLoadingPacing] = useState(false);
  const [batchPacingLoading, setBatchPacingLoading] = useState(false);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [batchTransLoading, setBatchTransLoading] = useState(false);
  const [loadingShake, setLoadingShake] = useState(false);
  const [batchShakeLoading, setBatchShakeLoading] = useState(false);

  const [pacingData, setPacingData] = useState<PacingData | null>(null);
  const [transData, setTransitionData] = useState<TransitionData | null>(null);
  const [shakeData, setShakeData] = useState<ShakeData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGeneratePacing = async () => {
    setLoadingPacing(true);
    try {
      const json = await api.runPacingSkill(fetchWithAuth, {
        visual_description:
          panel.visual_description || "Detailed drawing panel",
        speech_text: panel.speech_text || "",
        sfx: panel.sfx || "",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setPacingData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPacing(false);
    }
  };

  const handleGenerateTrans = async () => {
    setLoadingTrans(true);
    try {
      const json = await api.runTransitionSpeedSkill(fetchWithAuth, {
        visual_description:
          panel.visual_description || "Detailed drawing panel",
        speech_text: panel.speech_text || "",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setTransitionData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrans(false);
    }
  };

  const handleGenerateShake = async () => {
    setLoadingShake(true);
    try {
      const json = await api.runCameraShakeSkill(fetchWithAuth, {
        visual_description:
          panel.visual_description || "Action close-up illustration",
        sfx: panel.sfx || "[Impact]",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });
      if (json.success && json.result) {
        setShakeData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShake(false);
    }
  };

  const handleBatchGeneratePacing = async () => {
    if (!panels?.length) return;
    setBatchPacingLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runPacingSkill(fetchWithAuth, {
              visual_description: panelItem.visual_description || "Detailed drawing panel",
              speech_text: panelItem.speech_text || "",
              sfx: panelItem.sfx || "",
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated pacing guides for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchPacingLoading(false);
    }
  };

  const handleBatchGenerateTrans = async () => {
    if (!panels?.length) return;
    setBatchTransLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runTransitionSpeedSkill(fetchWithAuth, {
              visual_description: panelItem.visual_description || "Detailed drawing panel",
              speech_text: panelItem.speech_text || "",
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated transitions for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchTransLoading(false);
    }
  };

  const handleBatchGenerateShake = async () => {
    if (!panels?.length) return;
    setBatchShakeLoading(true);
    try {
      await Promise.all(
        panels.map(async (panelItem) => {
          try {
            await api.runCameraShakeSkill(fetchWithAuth, {
              visual_description:
                panelItem.visual_description || "Action close-up illustration",
              sfx: panelItem.sfx || "[Impact]",
              model: localStorage.getItem("ai_comic_model") || undefined,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
      if (addNotification) {
        addNotification(`Generated shake presets for ${panels.length} panels`, "success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBatchShakeLoading(false);
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
              Rhythm control
            </h5>
            <p className="mt-1 text-sm text-neutral-400">
              Tune pacing, transitions, and camera motion for stronger scene flow.
            </p>
          </div>
          <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
            Motion timing
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Scene pacing guides
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePacing}
                disabled={loadingPacing}
                title="Generate pacing for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingPacing ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGeneratePacing}
                disabled={batchPacingLoading || !panels?.length}
                title="Generate pacing for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchPacingLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {pacingData && !loadingPacing && (
            <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
              <div className="flex justify-between">
                <span className="text-neutral-500">Duration Mult.</span>
                <span className="text-purple-400 font-bold">
                  {pacingData.duration_multiplier}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Trans. Speed</span>
                <span className="text-purple-400 font-bold">
                  {pacingData.transition_speed_sec}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">BGM Volume Damp</span>
                <span className="text-purple-400 font-bold">
                  {(pacingData.bgm_volume_dampen * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Transition speed
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateTrans}
                disabled={loadingTrans}
                title="Generate transition timing for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingTrans ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGenerateTrans}
                disabled={batchTransLoading || !panels?.length}
                title="Generate transitions for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchTransLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {transData && !loadingTrans && (
            <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
              <div className="flex justify-between">
                <span className="text-neutral-500">Cut style</span>
                <span className="text-purple-400 font-bold uppercase">
                  {transData.transition_style}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cut frames (30fps)</span>
                <span className="text-purple-400 font-bold">
                  {transData.duration_frames} frames
                </span>
              </div>
              <p className="text-[9px] font-sans text-neutral-450 leading-relaxed pt-1 border-t border-neutral-900 mt-1">
                {transData.pacing_rationale}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-neutral-950/95 via-neutral-900/80 to-purple-950/20 p-4 space-y-3 shadow-[0_20px_40px_rgba(0,0,0,0.28)]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h5 className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              Camera shake
            </h5>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateShake}
                disabled={loadingShake}
                title="Generate camera shake for this panel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {loadingShake ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              </button>
              <button
                onClick={handleBatchGenerateShake}
                disabled={batchShakeLoading || !panels?.length}
                title="Generate camera shake for all panels"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 cursor-pointer"
              >
                {batchShakeLoading ? <Layers3 className="h-4 w-4 animate-pulse" /> : <Layers3 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {shakeData && !loadingShake && (
            <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
              <div className="flex justify-between">
                <span className="text-neutral-500">Shake Amp.</span>
                <span className="text-purple-400 font-bold">
                  {shakeData.shake_amplitude}px
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shake Freq.</span>
                <span className="text-purple-400 font-bold">
                  {shakeData.shake_frequency} Hz
                </span>
              </div>
              <div className="pt-1.5 border-t border-neutral-900 flex justify-between items-center">
                <span className="text-neutral-500 text-[8px] uppercase tracking-wider">
                  FFmpeg Formula
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(shakeData.ffmpeg_offset_formula, "formula")
                  }
                  className="text-neutral-500 hover:text-white"
                >
                  {copiedField === "formula" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <pre className="text-[8px] font-mono text-neutral-450 bg-black p-1.5 rounded select-all truncate">
                {shakeData.ffmpeg_offset_formula}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

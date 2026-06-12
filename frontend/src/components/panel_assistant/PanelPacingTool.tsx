import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface PanelPacingToolProps {
  panel: GeneratedPanel;
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

export default function PanelPacingTool({ panel }: PanelPacingToolProps) {
  const [loadingPacing, setLoadingPacing] = useState(false);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [loadingShake, setLoadingShake] = useState(false);
  
  const [pacingData, setPacingData] = useState<PacingData | null>(null);
  const [transData, setTransData] = useState<TransitionData | null>(null);
  const [shakeData, setShakeData] = useState<ShakeData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGeneratePacing = async () => {
    setLoadingPacing(true);
    try {
      const res = await fetch("/api/skills/pacing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Detailed drawing panel",
          speech_text: panel.speech_text || "",
          sfx: panel.sfx || "",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
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
      const res = await fetch("/api/skills/transition-speed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Detailed drawing panel",
          speech_text: panel.speech_text || "",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setTransData(json.result);
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
      const res = await fetch("/api/skills/camera-shake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visual_description: panel.visual_description || "Action close-up illustration",
          sfx: panel.sfx || "[Impact]",
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setShakeData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShake(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pacing Speed Multipliers */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">AI Scene Pacing Guides</h5>
          <button
            onClick={handleGeneratePacing}
            disabled={loadingPacing}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingPacing ? "Tuning..." : "✦ Suggest"}
          </button>
        </div>
        {pacingData && !loadingPacing && (
          <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
            <div className="flex justify-between">
              <span className="text-neutral-500">Duration Mult.</span>
              <span className="text-purple-400 font-bold">{pacingData.duration_multiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Trans. Speed</span>
              <span className="text-purple-400 font-bold">{pacingData.transition_speed_sec}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">BGM Volume Damp</span>
              <span className="text-purple-400 font-bold">{(pacingData.bgm_volume_dampen * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Transition Speeds */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">AI Cut Transition Speeds</h5>
          <button
            onClick={handleGenerateTrans}
            disabled={loadingTrans}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingTrans ? "Tuning..." : "✦ Suggest"}
          </button>
        </div>
        {transData && !loadingTrans && (
          <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
            <div className="flex justify-between">
              <span className="text-neutral-500">Cut style</span>
              <span className="text-purple-400 font-bold uppercase">{transData.transition_style}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Cut frames (30fps)</span>
              <span className="text-purple-400 font-bold">{transData.duration_frames} frames</span>
            </div>
            <p className="text-[9px] font-sans text-neutral-450 leading-relaxed pt-1 border-t border-neutral-900 mt-1">
              {transData.pacing_rationale}
            </p>
          </div>
        )}
      </div>

      {/* Camera Shake Dynamics */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h5 className="text-[11px] font-mono font-bold text-purple-450 uppercase tracking-wider">AI FFmpeg Camera Shake</h5>
          <button
            onClick={handleGenerateShake}
            disabled={loadingShake}
            className="text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer"
          >
            {loadingShake ? "Tuning..." : "✦ Suggest"}
          </button>
        </div>
        {shakeData && !loadingShake && (
          <div className="space-y-1.5 text-[10px] font-mono bg-neutral-950 p-2.5 rounded border border-neutral-850">
            <div className="flex justify-between">
              <span className="text-neutral-500">Shake Amp.</span>
              <span className="text-purple-400 font-bold">{shakeData.shake_amplitude}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shake Freq.</span>
              <span className="text-purple-400 font-bold">{shakeData.shake_frequency} Hz</span>
            </div>
            <div className="pt-1.5 border-t border-neutral-900 flex justify-between items-center">
              <span className="text-neutral-500 text-[8px] uppercase tracking-wider">FFmpeg Formula</span>
              <button
                onClick={() => copyToClipboard(shakeData.ffmpeg_offset_formula, "formula")}
                className="text-neutral-500 hover:text-white"
              >
                {copiedField === "formula" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <pre className="text-[8px] font-mono text-neutral-450 bg-black p-1.5 rounded select-all truncate">
              {shakeData.ffmpeg_offset_formula}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Layers, Volume2, RefreshCw, CheckCircle2, AlertCircle, Eye, X } from "lucide-react";
import { GeneratedPanel } from "@/types";
import * as api from "@/api";

interface LayerSeparationPanelProps {
  activeStoryboardPanel: GeneratedPanel | null;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification: (message: string, type: any) => void;
  fetchWithInterceptor: any;
}

export default function LayerSeparationPanel({
  activeStoryboardPanel,
  setPanels,
  addNotification,
  fetchWithInterceptor,
}: LayerSeparationPanelProps) {
  const [isProcessingLayers, setIsProcessingLayers] = useState(false);
  const [isAligning, setIsAligning] = useState(false);
  const [isDebuggingYolo, setIsDebuggingYolo] = useState(false);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);

  const handleDebugYolo = async () => {
    if (!activeStoryboardPanel?.image_url) return;
    setIsDebuggingYolo(true);
    addNotification("Running YOLO debug detection...", "info");
    try {
      if (debugImageUrl) {
        URL.revokeObjectURL(debugImageUrl);
        setDebugImageUrl(null);
      }
      const url = await api.debugYolo(fetchWithInterceptor, activeStoryboardPanel.image_url);
      setDebugImageUrl(url);
      addNotification("YOLO detections rendered successfully!", "success");
    } catch (err: any) {
      console.error("[Debug YOLO] Error:", err);
      addNotification(`Failed to render YOLO detections: ${err.message}`, "error");
    } finally {
      setIsDebuggingYolo(false);
    }
  };

  const closeDebugModal = () => {
    if (debugImageUrl) {
      URL.revokeObjectURL(debugImageUrl);
      setDebugImageUrl(null);
    }
  };

  if (!activeStoryboardPanel) {
    return (
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 text-[10px] text-purple-300 font-sans leading-relaxed flex items-start gap-2 shadow-inner">
        <span className="text-xs leading-none">💡</span>
        <p>
          <strong>Note:</strong> Insert this frame panel into the storyboard
          to run AI Layer Separation and Dialogue Audio Sync.
        </p>
      </div>
    );
  }

  const handleSeparateLayers = async () => {
    setIsProcessingLayers(true);
    addNotification("Starting AI layer separation...", "info");

    try {
      const data = await api.processLayers(
        fetchWithInterceptor,
        activeStoryboardPanel.id,
        { url: activeStoryboardPanel.image_url }
      );

      if (data.success && data.layers) {
        setPanels((prev) =>
          prev.map((p) =>
            p.id === activeStoryboardPanel.id
              ? {
                  ...p,
                  layers: {
                    background_url: data.layers.background_url,
                    character_url: data.layers.character_url,
                    text_url: data.layers.text_url,
                    bg_visible: true,
                    char_visible: true,
                    text_visible: true,
                  },
                }
              : p
          )
        );
        addNotification("Layers separated and saved successfully!", "success");
      } else {
        throw new Error(data.detail || "Layer separation failed");
      }
    } catch (err: any) {
      console.error("[Layer Separation] Error:", err);
      addNotification(`Failed to separate layers: ${err.message}`, "error");
    } finally {
      setIsProcessingLayers(false);
    }
  };

  const handleAlignDialogue = async () => {
    if (!activeStoryboardPanel.audio_url) {
      addNotification("Generate or set an audio file for this panel first.", "warning");
      return;
    }

    setIsAligning(true);
    addNotification("Aligning speech text with audio track...", "info");

    const ocr_texts = activeStoryboardPanel.speech_text
      ? activeStoryboardPanel.speech_text.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetchWithInterceptor(`/api/audio/align-dialogue/${activeStoryboardPanel.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_url: activeStoryboardPanel.audio_url,
          ocr_texts: ocr_texts.length > 0 ? ocr_texts : [activeStoryboardPanel.speech_text],
        }),
      });
      const data = await res.json();

      if (data.success && data.dialogue_map) {
        setPanels((prev) =>
          prev.map((p) =>
            p.id === activeStoryboardPanel.id
              ? {
                  ...p,
                  syncMap: {
                    dialogue_map: data.dialogue_map,
                    audio_peaks: data.audio_peaks || [],
                    peaks_fps: data.peaks_fps,
                  },
                }
              : p
          )
        );
        addNotification("Dialogue alignment sync mapped successfully!", "success");
      } else {
        throw new Error(data.detail || "Dialogue alignment failed");
      }
    } catch (err: any) {
      console.error("[Dialogue Alignment] Error:", err);
      addNotification(`Failed to align dialogue: ${err.message}`, "error");
    } finally {
      setIsAligning(false);
    }
  };

  const hasLayers = !!activeStoryboardPanel.layers;
  const hasSyncMap = !!activeStoryboardPanel.syncMap;

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-[#111115] border border-white/5 rounded-2xl p-4 space-y-2">
        <h4 className="text-[11px] font-mono text-purple-400 uppercase font-black tracking-wider">
          AI Motion Prep Suite
        </h4>
        <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
          Unlock 3D parallax effects and smart dialogue timing. Separation splits the panel into background, character, and text bubble transparent layers.
        </p>
      </div>

      {/* Control Actions */}
      <div className="space-y-3">
        {/* Layer Separation Trigger */}
        <button
          onClick={handleSeparateLayers}
          disabled={isProcessingLayers}
          className={`w-full py-2.5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            isProcessingLayers
              ? "bg-purple-900/10 text-purple-400 border-purple-800/20 cursor-not-allowed"
              : hasLayers
              ? "bg-purple-950/40 text-purple-300 border-purple-850 hover:bg-purple-900/30"
              : "bg-purple-600 hover:bg-purple-500 text-white border-purple-500/20 shadow-md shadow-purple-900/20"
          }`}
        >
          {isProcessingLayers ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
          <span>{hasLayers ? "Re-Run Layer Separation" : "Run AI Layer Separation"}</span>
        </button>

        {/* Dialogue Alignment Trigger */}
        <button
          onClick={handleAlignDialogue}
          disabled={isAligning || !activeStoryboardPanel.audio_url}
          className={`w-full py-2.5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-2 border transition-all ${
            !activeStoryboardPanel.audio_url
              ? "bg-neutral-900/40 text-neutral-500 border-neutral-800/40 cursor-not-allowed"
              : isAligning
              ? "bg-emerald-900/10 text-emerald-400 border-emerald-800/20 cursor-not-allowed"
              : hasSyncMap
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-850 hover:bg-emerald-900/30 cursor-pointer"
              : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20 shadow-md shadow-emerald-900/20 cursor-pointer"
          }`}
        >
          {isAligning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
          <span>{hasSyncMap ? "Re-Align Dialogue Sync" : "Align Dialogue Sync"}</span>
        </button>
        {/* Debug YOLO Trigger */}
        <button
          onClick={handleDebugYolo}
          disabled={isDebuggingYolo}
          className={`w-full py-2.5 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            isDebuggingYolo
              ? "bg-purple-900/10 text-purple-400 border-purple-800/20 cursor-not-allowed"
              : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10"
          }`}
        >
          {isDebuggingYolo ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          <span>Debug YOLO Detections</span>
        </button>
      </div>

      {/* Status Details */}
      {(hasLayers || hasSyncMap) && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <span className="text-[9px] font-mono text-neutral-500 uppercase font-black tracking-wider block">
            Processing Report
          </span>

          {/* Separation Report */}
          {hasLayers && (
            <div className="bg-[#111115] border border-emerald-950/40 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Transparent WebP Layers Generated</span>
              </div>
              <div className="text-[9px] font-mono text-neutral-500 space-y-1 pl-5">
                <div className="truncate">
                  <span className="text-neutral-450">BG: </span>
                  <a href={activeStoryboardPanel.layers?.background_url} target="_blank" rel="noreferrer" className="text-purple-400 underline hover:text-purple-300">
                    bg.webp
                  </a>
                </div>
                <div className="truncate">
                  <span className="text-neutral-450">Char: </span>
                  <a href={activeStoryboardPanel.layers?.character_url} target="_blank" rel="noreferrer" className="text-purple-400 underline hover:text-purple-300">
                    char.webp
                  </a>
                </div>
                <div className="truncate">
                  <span className="text-neutral-450">Text: </span>
                  <a href={activeStoryboardPanel.layers?.text_url} target="_blank" rel="noreferrer" className="text-purple-400 underline hover:text-purple-300">
                    text.webp
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Alignment Report */}
          {hasSyncMap && (
            <div className="bg-[#111115] border border-emerald-950/40 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Dialogue Audio Sync Map Linked</span>
              </div>
              <div className="text-[9px] font-mono text-neutral-500 space-y-1 pl-5">
                <div>
                  <span className="text-neutral-450">Synced Bubbles: </span>
                  <span className="text-emerald-400">{activeStoryboardPanel.syncMap?.dialogue_map.length} detected</span>
                </div>
                <div>
                  <span className="text-neutral-450">RMS Peaks: </span>
                  <span className="text-emerald-400">{activeStoryboardPanel.syncMap?.audio_peaks.length} frames</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help / Tips */}
      {!activeStoryboardPanel.audio_url && (
        <div className="bg-amber-950/20 border border-amber-850/40 rounded-xl p-3 flex items-start gap-2 text-amber-400 text-[9px] font-sans">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <p className="leading-relaxed">
            Generate panel speech audio in the <strong>Timeline</strong> or <strong>Adjust</strong> tabs to enable full word-level dialogue sync alignment.
          </p>
        </div>
      )}
      {/* YOLO Debug Modal Overlay */}
      {debugImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-neutral-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono text-purple-400 uppercase font-black tracking-wider">
                YOLO Bubble Detections
              </h3>
              <button
                onClick={closeDebugModal}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-900 rounded-2xl p-2 border border-white/5 min-h-[300px]">
              <img
                src={debugImageUrl}
                alt="YOLO Debug Overlay"
                className="max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            
            <div className="text-[10px] text-neutral-400 font-sans leading-relaxed bg-[#111115] border border-white/5 rounded-xl p-3">
              💡 <strong>Overlay Legend:</strong> Green filled areas represent YOLO segmented speech bubbles. 
              If the detection is incorrect, you can manually override it using the <strong>Eraser</strong> tool or add corrections.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

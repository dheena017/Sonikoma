import React, { useState } from "react";
import {
  Sparkles,
  Wand2,
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { EnhancementsPresets } from "@/features/editor_image_enhancements/components/EnhancementsPresets";
import { EnhancementsColors } from "@/features/editor_image_enhancements/components/EnhancementsColors";
import { EnhancementsCinematic } from "@/features/editor_image_enhancements/components/EnhancementsCinematic";
import { EnhancementsAudio } from "@/features/editor_image_enhancements/components/EnhancementsAudio";

interface EnhancementsPanelProps {
  activeStoryboardPanel: any;
  handleModifyBrightness: (panelId: number, val: number) => void;
  handleModifyContrast: (panelId: number, val: number) => void;
  handleModifySaturation: (panelId: number, val: number) => void;
  handleModifyFilterPreset: (panelId: number, preset: string) => void;
  handleModifyGrayscale: (panelId: number, val: boolean) => void;
  handleModifyDuration: (panelId: number, val: number) => void;
  handleModifyMotionType: (panelId: number, val: string) => void;
  handleModifySpeechText: (panelId: number, val: string) => void;
  handleModifyNarrative?: (panelId: number, val: string) => void;
  handleModifyVisualDescription?: (panelId: number, val: string) => void;
  handleModifySfx: (panelId: number, val: string) => void;
  handleModifyCropPadding: (panelId: number, val: number) => void;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  editingImageIdx?: number;
  totalImages?: number;
  addNotification?: (message: string, type: any) => void;
  fetchWithInterceptor?: any;
}

export default function EnhancementsPanel({
  activeStoryboardPanel,
  handleModifyBrightness,
  handleModifyContrast,
  handleModifySaturation,
  handleModifyFilterPreset,
  handleModifyGrayscale,
  handleModifyDuration,
  handleModifyMotionType,
  handleModifySpeechText,
  handleModifyNarrative,
  handleModifyVisualDescription,
  handleModifySfx,
  handleModifyCropPadding,
  setPanels,
  editingImageIdx = 0,
  totalImages = 1,
  addNotification,
  fetchWithInterceptor,
}: EnhancementsPanelProps) {
  const [isTracksExpanded, setIsTracksExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMagicProcessing, setIsMagicProcessing] = useState(false);

  const handleAnalyzeImage = async () => {
    if (!activeStoryboardPanel) {
      addNotification?.(
        "No active panel selected for image analysis.",
        "warning"
      );
      return;
    }
    setIsAnalyzing(true);
    addNotification?.("Running AI analysis on image...", "info");
    try {
      if (fetchWithInterceptor) {
        await fetchWithInterceptor(
          `/api/image/analyze-panel/${activeStoryboardPanel.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: activeStoryboardPanel.image_url }),
          }
        ).catch(() => {});
      }
      addNotification?.("Image analysis completed!", "success");
    } catch (err: any) {
      addNotification?.(`Analysis error: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenPanelAssistant = () => {
    window.history.pushState(
      {},
      "",
      `/creative-suite/panel-assistant?idx=${editingImageIdx}`
    );
    window.dispatchEvent(new Event("popstate"));
  };

  const handleMagicMotion = async () => {
    if (!activeStoryboardPanel) {
      addNotification?.(
        "No active panel selected for Magic Motion.",
        "warning"
      );
      return;
    }
    setIsMagicProcessing(true);
    addNotification?.("Starting Magic Motion Macro...", "info");
    try {
      if (fetchWithInterceptor && activeStoryboardPanel.id) {
        await fetchWithInterceptor(
          `/api/image/process-layers/${activeStoryboardPanel.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: activeStoryboardPanel.image_url }),
          }
        ).catch(() => {});
      }
      addNotification?.("Magic Motion processing complete!", "success");
    } catch (err: any) {
      addNotification?.(`Magic Motion error: ${err.message}`, "error");
    } finally {
      setIsMagicProcessing(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-left w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs uppercase font-mono font-bold text-white tracking-wider">
            Image Enhancements
          </span>
        </div>
      </div>

      {/* Fine-Tuning & Presets */}
      <EnhancementsPresets
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyFilterPreset={handleModifyFilterPreset}
        handleModifyGrayscale={handleModifyGrayscale}
      />

      <EnhancementsColors
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyBrightness={handleModifyBrightness}
        handleModifyContrast={handleModifyContrast}
        handleModifySaturation={handleModifySaturation}
      />

      {/* Cinematic & Motion Timing */}
      <EnhancementsCinematic
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifyDuration={handleModifyDuration}
        handleModifyMotionType={handleModifyMotionType}
        handleModifyCropPadding={handleModifyCropPadding}
        setPanels={setPanels}
      />

      {/* Dialogue, Narrative & Scene Description */}
      <EnhancementsAudio
        activeStoryboardPanel={activeStoryboardPanel}
        handleModifySpeechText={handleModifySpeechText}
        handleModifyNarrative={handleModifyNarrative}
        handleModifyVisualDescription={handleModifyVisualDescription}
        handleModifySfx={handleModifySfx}
        setPanels={setPanels}
      />

      {/* AI Action Trigger Buttons */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={handleAnalyzeImage}
          className="w-full py-2.5 rounded-xl border border-[#2F2F2F] bg-[#2A2A2A] hover:bg-[#333333] hover:border-[#3B82F6] text-white text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-[#3B82F6] animate-pulse" />
          )}
          <span>{isAnalyzing ? "Analyzing..." : "Analyze Image"}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenPanelAssistant}
          className="w-full py-2.5 rounded-xl border border-[#2F2F2F] bg-[#2A2A2A] hover:bg-[#333333] hover:border-[#3B82F6] text-neutral-200 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span>Panel Assistant</span>
        </button>

        <button
          type="button"
          disabled={isMagicProcessing}
          onClick={handleMagicMotion}
          className="w-full py-2.5 rounded-xl border border-[#2F2F2F] bg-[#2A2A2A] hover:bg-[#333333] hover:border-[#3B82F6] text-white text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 shadow-sm"
        >
          {isMagicProcessing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
          ) : (
            <Wand2 className="h-3.5 w-3.5 text-[#3B82F6] animate-pulse" />
          )}
          <span>
            {isMagicProcessing ? "Applying Magic..." : "Magic Motion"}
          </span>
        </button>
      </div>

      {/* Multi-Layer Tracks Accordion */}
      {setPanels && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <button
            type="button"
            onClick={() => setIsTracksExpanded(!isTracksExpanded)}
            className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-[#3B82F6] hover:text-[#93C5FD] py-1 transition-all cursor-pointer outline-none"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Layer Tracks</span>
            </div>
            {isTracksExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {isTracksExpanded && (
            <div className="space-y-1.5 pl-1 animate-in fade-in duration-150">
              {/* Background Track */}
              <div className="flex items-center justify-between bg-black/30 border border-white/5 px-2.5 py-1.5 rounded-xl gap-2">
                <div className="flex items-center gap-2">
                  {activeStoryboardPanel?.layers?.background_url && (
                    <img
                      src={activeStoryboardPanel.layers.background_url}
                      alt="Background Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-white/10 bg-neutral-950 flex-shrink-0"
                    />
                  )}
                  <span className="text-[10px] font-mono text-neutral-300">
                    Background
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeStoryboardPanel) return;
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === activeStoryboardPanel.id
                          ? {
                              ...p,
                              layers: {
                                ...p.layers!,
                                bg_visible:
                                  p.layers!.bg_visible !== false ? false : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.bg_visible !== false
                      ? "text-[#3B82F6]"
                      : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.bg_visible !== false ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Character Track */}
              <div className="flex items-center justify-between bg-black/30 border border-white/5 px-2.5 py-1.5 rounded-xl gap-2">
                <div className="flex items-center gap-2">
                  {activeStoryboardPanel?.layers?.character_url && (
                    <img
                      src={activeStoryboardPanel.layers.character_url}
                      alt="Character Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-white/10 bg-neutral-950 flex-shrink-0"
                    />
                  )}
                  <span className="text-[10px] font-mono text-neutral-300">
                    Character
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeStoryboardPanel) return;
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === activeStoryboardPanel.id
                          ? {
                              ...p,
                              layers: {
                                ...p.layers!,
                                char_visible:
                                  p.layers!.char_visible !== false
                                    ? false
                                    : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.char_visible !== false
                      ? "text-[#3B82F6]"
                      : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.char_visible !== false ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Text Bubbles Track */}
              <div className="flex items-center justify-between bg-black/30 border border-white/5 px-2.5 py-1.5 rounded-xl gap-2">
                <div className="flex items-center gap-2">
                  {activeStoryboardPanel?.layers?.text_url && (
                    <img
                      src={activeStoryboardPanel.layers.text_url}
                      alt="Text Thumbnail"
                      className="h-8 w-8 object-contain rounded border border-white/10 bg-neutral-950 flex-shrink-0"
                    />
                  )}
                  <span className="text-[10px] font-mono text-neutral-300">
                    Text Bubbles
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeStoryboardPanel) return;
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === activeStoryboardPanel.id
                          ? {
                              ...p,
                              layers: {
                                ...p.layers!,
                                text_visible:
                                  p.layers!.text_visible !== false
                                    ? false
                                    : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.text_visible !== false
                      ? "text-[#3B82F6]"
                      : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.text_visible !== false ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Status Meta Bar */}
      <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-2 font-mono border-t border-white/5">
        <span>
          {activeStoryboardPanel?.layers ? "Motion Comic" : "Standard Panel"}
        </span>
        <span>
          Panel Index {editingImageIdx + 1} / {totalImages}
        </span>
      </div>
    </div>
  );
}

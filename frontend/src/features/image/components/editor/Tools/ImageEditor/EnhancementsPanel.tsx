import React, { useState } from "react";
import { Sparkles, Wand2, Layers, ChevronUp, ChevronDown, Eye, EyeOff, RefreshCw } from "lucide-react";
import { EnhancementsPresets } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsPresets";
import { EnhancementsColors } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsColors";
import { EnhancementsCinematic } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsCinematic";
import { EnhancementsAudio } from "@/features/image/components/editor/Tools/ImageEditor/EnhancementsAudio";

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
      addNotification?.("No active panel selected for image analysis.", "warning");
      return;
    }
    setIsAnalyzing(true);
    addNotification?.("Running AI analysis on image...", "info");
    try {
      if (fetchWithInterceptor) {
        await fetchWithInterceptor(`/api/image/analyze-panel/${activeStoryboardPanel.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: activeStoryboardPanel.image_url }),
        }).catch(() => {});
      }
      addNotification?.("Image analysis completed!", "success");
    } catch (err: any) {
      addNotification?.(`Analysis error: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenPanelAssistant = () => {
    window.history.pushState({}, "", `/panel-assistant?idx=${editingImageIdx}`);
    window.dispatchEvent(new Event("popstate"));
  };

  const handleMagicMotion = async () => {
    if (!activeStoryboardPanel) {
      addNotification?.("No active panel selected for Magic Motion.", "warning");
      return;
    }
    setIsMagicProcessing(true);
    addNotification?.("Starting Magic Motion Macro...", "info");
    try {
      if (fetchWithInterceptor && activeStoryboardPanel.id) {
        await fetchWithInterceptor(`/api/image/process-layers/${activeStoryboardPanel.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: activeStoryboardPanel.image_url }),
        }).catch(() => {});
      }
      addNotification?.("Magic Motion processing complete!", "success");
    } catch (err: any) {
      addNotification?.(`Magic Motion error: ${err.message}`, "error");
    } finally {
      setIsMagicProcessing(false);
    }
  };

  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
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
          className="w-full py-2 rounded-xl border border-purple-800/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:border-purple-600 text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          )}
          <span>{isAnalyzing ? "Analyzing..." : "Analyze Image"}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenPanelAssistant}
          className="w-full py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-purple-600/50 text-neutral-300 hover:text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Panel Assistant</span>
        </button>

        <button
          type="button"
          disabled={isMagicProcessing}
          onClick={handleMagicMotion}
          className="w-full py-2 rounded-xl border border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
        >
          {isMagicProcessing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
          ) : (
            <Wand2 className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          )}
          <span>{isMagicProcessing ? "Applying Magic..." : "Magic Motion"}</span>
        </button>
      </div>

      {/* Multi-Layer Tracks Accordion */}
      {setPanels && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <button
            type="button"
            onClick={() => setIsTracksExpanded(!isTracksExpanded)}
            className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 py-1 transition-all cursor-pointer outline-none"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Layer Tracks</span>
            </div>
            {isTracksExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
                  <span className="text-[10px] font-mono text-neutral-300">Background</span>
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
                                bg_visible: p.layers!.bg_visible !== false ? false : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.bg_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.bg_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
                  <span className="text-[10px] font-mono text-neutral-300">Character</span>
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
                                char_visible: p.layers!.char_visible !== false ? false : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.char_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.char_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
                  <span className="text-[10px] font-mono text-neutral-300">Text Bubbles</span>
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
                                text_visible: p.layers!.text_visible !== false ? false : true,
                              },
                            }
                          : p
                      )
                    );
                  }}
                  className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                    activeStoryboardPanel?.layers?.text_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {activeStoryboardPanel?.layers?.text_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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

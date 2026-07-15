import React from "react";
import { Sparkles, RefreshCw, X, Eye, EyeOff, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { getPanelFilterStyle } from "@/utils";
import { generateTts } from "../../../api";
import { useImageEditorStore } from "../../../hooks/useImageEditorState";

let autoPlayHintShown = false;

interface TimelineCardProps {
  panel: GeneratedPanel;
  idx: number;
  currentPanelIndex: number;
  activePreviewTab: "video" | "timeline";
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setPlaybackTime: (time: number) => void;
  analyzingPanelId: number | null;
  handleShiftPanel: (idx: number, dir: "left" | "right") => void;
  panelsLength: number;
  handleModifySpeechText: (id: number, val: string) => void;
  handleModifyMotion: (id: number, val: string) => void;
  handleModifyDuration: (id: number, val: number) => void;
  handleModifySFX: (id: number, val: string) => void;
  handleModifyVisualDescription: (id: number, val: string) => void;
  handleModifyNarrative?: (id: number, val: string) => void;
  handleAnalyzePanel: (id: number, url: string) => void;
  handleCancelAnalysis?: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPanelClick?: (idx: number, panelId: number, shiftKey: boolean, ctrlOrMeta: boolean) => void;
  onPanelDoubleClick?: (idx: number, panelId: number) => void;
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
  autoPlayAudio?: boolean;
  addNotification?: (message: string, type: any) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  fetchWithInterceptor?: any;
  voiceActor?: string;
  speechRate?: number;
  speechPitch?: number;
}

interface DialogueClipSliderProps {
  panel: GeneratedPanel;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
}

const DialogueClipSlider: React.FC<DialogueClipSliderProps> = ({ panel, setPanels }) => {
  const duration = panel.duration || 3.0;

  const dialogueMap = panel.syncMap?.dialogue_map || [];
  const currentSegment = dialogueMap[0] || {
    ocr_index: 0,
    ocr_text: panel.speech_text || "",
    whisper_text: panel.speech_text || "",
    start_time: 0.0,
    end_time: duration,
    confidence: 1.0
  };

  const startTime = currentSegment.start_time;
  const endTime = currentSegment.end_time;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = React.useState<{
    type: "center" | "left" | "right" | null;
    startX: number;
    initialStart: number;
    initialEnd: number;
  }>({ type: null, startX: 0, initialStart: 0, initialEnd: 0 });

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "center" | "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      type,
      startX: e.clientX,
      initialStart: startTime,
      initialEnd: endTime
    });
  };

  React.useEffect(() => {
    if (!dragState.type) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      if (trackWidth <= 0) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaT = (deltaX / trackWidth) * duration;

      let newStart = dragState.initialStart;
      let newEnd = dragState.initialEnd;

      if (dragState.type === "center") {
        const clipDuration = dragState.initialEnd - dragState.initialStart;
        newStart = Math.max(0, Math.min(duration - clipDuration, dragState.initialStart + deltaT));
        newEnd = newStart + clipDuration;
      } else if (dragState.type === "left") {
        newStart = Math.max(0, Math.min(dragState.initialEnd - 0.1, dragState.initialStart + deltaT));
      } else if (dragState.type === "right") {
        newEnd = Math.max(dragState.initialStart + 0.1, Math.min(duration, dragState.initialEnd + deltaT));
      }

      setPanels((prev) =>
        prev.map((p) => {
          if (p.id !== panel.id) return p;

          const currentSyncMap = p.syncMap || { dialogue_map: [], audio_peaks: [] };
          const currentMap = currentSyncMap.dialogue_map || [];

          let updatedMap = [...currentMap];
          if (updatedMap.length === 0) {
            updatedMap = [
              {
                ocr_index: 0,
                ocr_text: p.speech_text || "",
                whisper_text: p.speech_text || "",
                start_time: Number(newStart.toFixed(2)),
                end_time: Number(newEnd.toFixed(2)),
                confidence: 1.0
              }
            ];
          } else {
            updatedMap[0] = {
              ...updatedMap[0],
              start_time: Number(newStart.toFixed(2)),
              end_time: Number(newEnd.toFixed(2))
            };
          }

          return {
            ...p,
            syncMap: {
              ...currentSyncMap,
              dialogue_map: updatedMap
            }
          };
        })
      );
    };

    const handleMouseUp = () => {
      setDragState({ type: null, startX: 0, initialStart: 0, initialEnd: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, duration, panel.id, setPanels]);

  const leftPct = (startTime / duration) * 100;
  const widthPct = ((endTime - startTime) / duration) * 100;

  return (
    <div className="flex-1 max-w-[130px] flex flex-col gap-1 select-none" onClick={(e) => e.stopPropagation()}>
      <div
        ref={trackRef}
        className="h-4 bg-neutral-950 border border-neutral-800 rounded relative overflow-hidden"
      >
        <div className="absolute inset-0 flex justify-between opacity-15 pointer-events-none">
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
          <div className="w-[1px] h-full bg-white"></div>
        </div>

        <div
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`
          }}
          className="absolute top-0 bottom-0 bg-purple-600 hover:bg-purple-500/90 border-l border-r border-purple-400 rounded flex items-center justify-between group cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, "center")}
        >
          <div
            className="w-1.5 h-full bg-purple-400/70 hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />

          <span className="text-[7px] font-mono font-bold text-white leading-none truncate pointer-events-none px-0.5">
            {startTime.toFixed(1)}s-{endTime.toFixed(1)}s
          </span>

          <div
            className="w-1.5 h-full bg-purple-400/70 hover:bg-white cursor-ew-resize flex-shrink-0"
            onMouseDown={(e) => handleMouseDown(e, "right")}
          />
        </div>
      </div>
    </div>
  );
};

const TimelineCard = ({
  panel,
  idx,
  currentPanelIndex,
  activePreviewTab,
  setCurrentPanelIndex,
  setActivePreviewTab,
  setPlaybackTime,
  analyzingPanelId,
  handleShiftPanel,
  panelsLength,
  handleModifySpeechText,
  handleModifyMotion,
  handleModifyDuration,
  handleModifySFX,
  handleModifyVisualDescription,
  handleModifyNarrative,
  handleAnalyzePanel,
  handleCancelAnalysis,
  isSelected,
  onToggleSelect,
  onPanelClick,
  onPanelDoubleClick,
  playStoryboardAudio,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  autoPlayAudio,
  addNotification,
  isDragging,
  isDragOver,
  setPanels,
  fetchWithInterceptor,
  voiceActor,
  speechRate,
  speechPitch,
}: TimelineCardProps) => {
  const [isTracksExpanded, setIsTracksExpanded] = React.useState(false);
  const [isMagicProcessing, setIsMagicProcessing] = React.useState(false);
  const isCurrent =
    idx === currentPanelIndex && activePreviewTab === "timeline";

  const handleMagicMotion = async () => {
    if (!panel.speech_text?.trim()) {
      addNotification?.("Dialogue text is required for Dialogue Sync alignment. Please type some text first.", "warning");
      return;
    }

    setIsMagicProcessing(true);
    addNotification?.("Starting Magic Motion Macro...", "info");

    try {
      // 1. Separate Layers
      addNotification?.("Step 1/3: Running AI Layer Separation...", "info");
      const layerRes = await fetchWithInterceptor(`/api/image/process-layers/${panel.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: panel.image_url }),
      });

      let layersObj = null;
      if (layerRes.ok) {
        const layerData = await layerRes.json();
        if (layerData.success && layerData.layers) {
          layersObj = {
            background_url: layerData.layers.background_url,
            character_url: layerData.layers.character_url,
            text_url: layerData.layers.text_url,
            bg_visible: true,
            char_visible: true,
            text_visible: true,
          };
        }
      }

      // 2. Generate Audio TTS
      addNotification?.("Step 2/3: Generating speech audio...", "info");
      const ttsRes = await generateTts(fetchWithInterceptor, {
        panel_id: panel.id,
        text: panel.speech_text,
        dialogue_list: [panel.speech_text],
        target_duration: panel.duration > 0 ? panel.duration : 4.5,
        voice: voiceActor || undefined,
        speech_rate: speechRate,
        speech_pitch: speechPitch,
      });

      let audioUrl = null;
      // Audio may come back as a cached URL or as base64
      if (ttsRes && ttsRes.success && ttsRes.audio_url) {
        audioUrl = ttsRes.audio_url;
      } else if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
        // Convert base64 to a blob URL so the player can use it
        const binary = atob(ttsRes.audio_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        audioUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      }

      // Capture the actual audio duration from TTS (precise timing)
      const audioDuration: number =
        ttsRes && ttsRes.duration_actual_s && ttsRes.duration_actual_s > 0
          ? Math.round(ttsRes.duration_actual_s * 10) / 10
          : 0;

      // 3. Dialogue Sync Alignment (only if audio succeeded)
      let syncMapObj = null;
      if (audioUrl) {
        addNotification?.("Step 3/3: Aligning dialogue to audio playhead...", "info");
        const ocr_texts = panel.speech_text.split("\n").map((s) => s.trim()).filter(Boolean);
        const alignRes = await fetchWithInterceptor(`/api/audio/align-dialogue/${panel.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio_url: audioUrl,
            ocr_texts: ocr_texts.length > 0 ? ocr_texts : [panel.speech_text],
          }),
        });
        const alignData = await alignRes.json();

        if (alignData.success && alignData.dialogue_map) {
          syncMapObj = {
            dialogue_map: alignData.dialogue_map,
            audio_peaks: alignData.audio_peaks || [],
            peaks_fps: alignData.peaks_fps,
          };
        }
      }

      // 4. Update the panel state atomically with all results.
      //    - TIMING: always sync to actual audio duration (never estimate).
      //    - CAM MOTION: preserve the AI-decided motion from "Analyze Image".
      //      Only fall back to "zoom_in" when the panel has no motion yet.
      if (setPanels) {
        setPanels((prev: any[]) =>
          prev.map((p) =>
            p.id === panel.id
              ? {
                  ...p,
                  // Preserve AI-decided motion; only default if completely unset
                  motion_type: p.motion_type && p.motion_type.trim().length > 0
                    ? p.motion_type
                    : "zoom_in",
                  // Sync timing to actual audio length
                  duration: audioDuration > 0 ? audioDuration : p.duration,
                  audio_url: audioUrl || p.audio_url,
                  layers: layersObj || p.layers,
                  syncMap: syncMapObj || p.syncMap,
                }
              : p
          )
        );
      }

      addNotification?.("✓ Magic Motion successfully fully configured for this panel!", "success");
    } catch (err: any) {
      console.error("[Magic Motion] macro failed:", err);
      addNotification?.(`Magic Motion macro failed: ${err.message || String(err)}`, "error");
    } finally {
      setIsMagicProcessing(false);
    }
  };

  const handleDragStartLocal = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    // Prevent dragging if interacting with inputs, textareas, selectors or buttons
    if (
      target.tagName.toLowerCase() === "textarea" ||
      target.tagName.toLowerCase() === "input" ||
      target.tagName.toLowerCase() === "select" ||
      target.tagName.toLowerCase() === "option" ||
      target.tagName.toLowerCase() === "button" ||
      target.closest(".no-drag")
    ) {
      e.preventDefault();
      return;
    }
    if (onDragStart) {
      onDragStart(e, idx);
    }
  };

  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shiftKey = e.shiftKey;
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Perform double click actions
      onPanelDoubleClick?.(idx, panel.id);

      // Snap floating player coordinates to { x: 20, y: 80 } and set isPlayerOpen: true
      useImageEditorStore.getState().setPlayerSettings({
        isPlayerOpen: true,
        playerPos: { x: 20, y: 80 }
      });

    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        console.log(
          `[TimelineCard] Selecting panel #${panel.id} at index ${idx}`
        );
        setCurrentPanelIndex(idx);
        setActivePreviewTab("timeline");
        setPlaybackTime(0);
        if (onPanelClick) {
          onPanelClick(idx, panel.id, shiftKey, ctrlOrMeta);
        } else {
          onToggleSelect();
        }
        if (playStoryboardAudio) {
          // Delay voice synthesis slightly so the UI state change and outline render instantly
          setTimeout(() => {
            playStoryboardAudio(idx);
            if (!autoPlayAudio && !autoPlayHintShown) {
              autoPlayHintShown = true;
              addNotification?.(
                "Auto-play is off. Enable Auto-play TTS Audios in settings to hear this panel automatically.",
                "info"
              );
            }
          }, 50);
        }
      }, 250);
    };
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStartLocal}
      onDragOver={(e) => onDragOver && onDragOver(e, idx)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop && onDrop(e, idx)}
      className={`w-[220px] sm:w-[260px] shrink-0 rounded-xl border p-3 space-y-2.5 transition-all duration-200 ${
        isDragging
          ? "opacity-35 border-dashed border-purple-500/50 bg-neutral-900/20 scale-98"
          : isDragOver
          ? "bg-neutral-900 border-purple-400 scale-102 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          : isCurrent && isSelected
          ? "bg-purple-950/40 border-purple-400 ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          : isCurrent
          ? "bg-neutral-800/80 border-purple-500 shadow-lg"
          : isSelected
          ? "bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/70 shadow-[0_0_16px_rgba(168,85,247,0.35)]"
          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
      } cursor-grab active:cursor-grabbing`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={handleThumbnailClick}
        className="relative h-28 sm:h-32 rounded-lg overflow-hidden cursor-pointer select-none bg-neutral-950 border border-neutral-800 flex items-center justify-center group"
      >
        <img
          src={panel.image_url}
          alt={`Panel ${panel.id}`}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          style={{ filter: getPanelFilterStyle(panel) }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />

        {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
          <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center animate-pulse z-10">
            <Sparkles
              className="h-5 w-5 text-purple-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-[9px] font-mono font-bold text-purple-300 mt-1 uppercase tracking-wider">
              Loading...
            </span>
            <div className="scanner-line" />
          </div>
        )}

        {/* Selection indicator overlay when selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-purple-600/10 border-2 border-purple-500/60 rounded-lg pointer-events-none z-[5]" />
        )}

        {/* Selection checkbox - always visible on hover, prominent when selected */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`absolute top-2 left-2 h-6 w-6 rounded-md flex items-center justify-center z-20 transition-all duration-150 ${
            isSelected
              ? "bg-purple-500 border-2 border-purple-300 shadow-lg shadow-purple-500/50 scale-110"
              : "bg-black/60 border-2 border-neutral-500 hover:border-purple-400 hover:bg-purple-900/50 opacity-0 group-hover:opacity-100"
          }`}
          title={isSelected ? "Deselect panel" : "Select panel"}
        >
          {isSelected ? (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="h-2.5 w-2.5 rounded-sm bg-neutral-600" />
          )}
        </button>

        {/* Number tag */}
        <div className="absolute top-2 left-8 h-5 rounded bg-black/80 backdrop-blur flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold border border-purple-900/40 px-1.5">
          #{panel.id}
        </div>

        {/* Reorder Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[TimelineCard] Shifting panel #${panel.id} left`);
              handleShiftPanel(idx, "left");
            }}
            disabled={idx === 0}
            className="p-1 rounded bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[TimelineCard] Shifting panel #${panel.id} right`);
              handleShiftPanel(idx, "right");
            }}
            disabled={idx === panelsLength - 1}
            className="p-1 rounded bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Right"
          >
            ▶
          </button>
        </div>

        {/* Motion overlay text */}
        {panel.motion_type && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300">
            {panel.motion_type}
          </div>
        )}
      </div>

      {/* Dialogue/Subtitle Text OCR Editable Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Dialogue/Subtitle Text
          </label>
          {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
            <span className="text-[9px] font-mono font-bold text-purple-400 animate-pulse flex items-center gap-0.5">
              <span>✦ Loading...</span>
            </span>
          )}
        </div>
        <textarea
          rows={2}
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.speech_text}
          onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
              : ""
          }`}
        />
      </div>

      {/* Narrative Text Editable Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
          Narrative Text
        </label>
        <textarea
          rows={2}
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.narrative || ""}
          onChange={(e) => handleModifyNarrative && handleModifyNarrative(panel.id, e.target.value)}
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
              : ""
          }`}
        />
      </div>

      {/* Sound Effect (SFX) Editable Input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          Sound Effect (SFX)
        </label>
        <input
          type="text"
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.sfx || ""}
          onChange={(e) => handleModifySFX(panel.id, e.target.value)}
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[10px] rounded-lg px-2.5 py-1.5 text-neutral-100 outline-none focus:border-purple-500 font-mono transition-all no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
              : ""
          }`}
        />
      </div>

      {/* Visual Scene Description Editable Input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          Visual Scene Description
        </label>
        <textarea
          rows={2}
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.visual_description || ""}
          onChange={(e) =>
            handleModifyVisualDescription(panel.id, e.target.value)
          }
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[10px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
              : ""
          }`}
        />
      </div>

      {/* Playback specifications (hidden on small screens to save vertical space) */}
      <div className="hidden sm:grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-900/80">
        <div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase block">
            Cam Motion
          </span>
          <select
            value={panel.motion_type ?? ""}
            onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
            className="appearance-none bg-neutral-800 text-[11px] text-white rounded-lg border border-neutral-700 hover:border-purple-500/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 p-1.5 w-full outline-none no-drag cursor-pointer transition-colors"
          >
            <option value="">None</option>
            <option value="zoom_in">Zoom In</option>
            <option value="zoom_out">Zoom Out</option>
            <option value="pan_right">Pan Right</option>
            <option value="pan_left">Pan Left</option>
            <option value="pan_down">Pan Down</option>
          </select>
        </div>

        <div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase block">
            Timing (sec)
          </span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={panel.duration === 0 ? "" : panel.duration}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num) && num >= 0) {
                handleModifyDuration(panel.id, num);
              } else if (e.target.value === "") {
                handleModifyDuration(panel.id, 0);
              }
            }}
            onBlur={(e) => {
              if (e.target.value === "" || parseFloat(e.target.value) <= 0) {
                handleModifyDuration(panel.id, 0);
              }
            }}
            placeholder="0.0"
            className="bg-neutral-800 text-[11px] text-white rounded-lg border border-neutral-700 hover:border-purple-500/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 p-1.5 w-full outline-none text-center font-mono no-drag transition-colors"
          />
        </div>
      </div>

      <div className="pt-2">
        {analyzingPanelId === panel.id ? (
          <button
            type="button"
            onClick={() => handleCancelAnalysis && handleCancelAnalysis()}
            className="w-full py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-rose-600/20 border-rose-500/50 hover:bg-rose-600/40 text-rose-300 hover:border-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.15)]"
          >
            <X className="h-3 w-3 text-rose-400" />
            <span className="hidden sm:inline">Stop Analyzing</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={
              analyzingPanelId !== null && analyzingPanelId !== panel.id
            }
            onClick={() => {
              console.log(
                `[TimelineCard] Manual AI analysis triggered for panel #${panel.id}`
              );
              handleAnalyzePanel(panel.id, panel.image_url);
            }}
            className={`w-full py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all bg-purple-950/40 border-purple-800/40 hover:bg-purple-900/60 text-purple-300 hover:border-purple-600 ${
              analyzingPanelId !== null && analyzingPanelId !== panel.id
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">Analyze Image</span>
          </button>
        )}
      </div>

      <div className="pt-1.5">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, "", `/panel-assistant?idx=${idx}`);
            window.dispatchEvent(new Event("popstate"));
          }}
          className="w-full py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-purple-600/50 text-neutral-350 hover:text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <Sparkles className="h-3 w-3 text-purple-400" />
          <span>Panel Assistant</span>
        </button>
      </div>

      {setPanels && fetchWithInterceptor && (
        <div className="pt-1.5">
          <button
            type="button"
            disabled={isMagicProcessing}
            onClick={handleMagicMotion}
            className="w-full py-1.5 rounded-lg border border-purple-900/60 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isMagicProcessing ? (
              <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
            )}
            <span>{isMagicProcessing ? "Applying Magic..." : "Magic Motion"}</span>
          </button>
        </div>
      )}

      {/* Accordion Layer Tracks (Motion Comic Mode) */}
      {panel.layers && setPanels && (
        <div className="pt-2 border-t border-neutral-900 space-y-2 no-drag">
          <button
            type="button"
            onClick={() => setIsTracksExpanded(!isTracksExpanded)}
            className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 py-1 transition-all cursor-pointer outline-none focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Layer Tracks</span>
            </div>
            {isTracksExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {isTracksExpanded && (
            <div className="space-y-1.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* BG Track */}
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={panel.layers.background_url}
                    alt="Background Thumbnail"
                    className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[10px] font-mono text-neutral-300">Background</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === panel.id
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
                  className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                    panel.layers.bg_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {panel.layers.bg_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Character Track */}
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={panel.layers.character_url}
                    alt="Character Thumbnail"
                    className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[10px] font-mono text-neutral-300">Character</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === panel.id
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
                  className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                    panel.layers.char_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {panel.layers.char_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Text Track */}
              <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img
                    src={panel.layers.text_url}
                    alt="Text Thumbnail"
                    className="h-8 w-8 object-contain rounded border border-neutral-850 bg-neutral-950 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[10px] font-mono text-neutral-300 flex-shrink-0">Text Bubbles</span>
                  <DialogueClipSlider panel={panel} setPanels={setPanels} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPanels((prev) =>
                      prev.map((p) =>
                        p.id === panel.id
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
                  className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                    panel.layers.text_visible !== false ? "text-purple-400" : "text-neutral-600"
                  }`}
                >
                  {panel.layers.text_visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1 font-mono">
        <span>
          {panel.layers ? "Motion Comic" : "Standard Panel"}
        </span>
        <span>
          {idx + 1} / {panelsLength}
        </span>
      </div>
    </div>
  );
};

export default React.memo(TimelineCard, (prevProps, nextProps) => {
  return (
    prevProps.panel === nextProps.panel &&
    prevProps.idx === nextProps.idx &&
    prevProps.currentPanelIndex === nextProps.currentPanelIndex &&
    prevProps.activePreviewTab === nextProps.activePreviewTab &&
    prevProps.analyzingPanelId === nextProps.analyzingPanelId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.panelsLength === nextProps.panelsLength
  );
});

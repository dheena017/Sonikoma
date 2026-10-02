import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MessageSquare,
  Camera,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import type {
  AISeriesPanel,
  CharacterDNA,
  InteractiveSpeechBubble,
} from "@/api/endpoints/aiSeries";
import VisualsTab from "./VisualsTab";
import SpeechTab from "./SpeechTab";

export interface RightSidePanelInspectorProps {
  seriesId: string;
  seriesTitle?: string;
  formatType?: string;
  sessionNumber: number;
  chapterNumber: number;
  chapters?: any[];
  onSelectChapter?: (sessNum: number, chapNum: number) => void;
  selectedPanelIdx: number;
  totalPanels: number;
  panel: AISeriesPanel | null;
  cast?: CharacterDNA[];
  imageModel?: string;
  isRegenerating: boolean;
  onSelectPanelIdx: (idx: number) => void;
  onUpdatePanel: (updated: Partial<AISeriesPanel>) => void;
  onRegenerateVisual: (prompt: string, model?: string) => Promise<void>;
  onSynthesizeAudio?: (speaker: string, text: string) => Promise<void>;
  onClose?: () => void;
  addNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  onSynthesizeChapterVisuals?: (model?: string) => Promise<void>;
  isSynthesizingVisuals?: boolean;
  onSynthesizeChapterAudio?: () => Promise<void>;
  isSynthesizingAudio?: boolean;
  onOpenCharacterVault?: () => void;
  onOpenWorldBible?: () => void;
  showSpeechBubbles?: boolean;
  onToggleSpeechBubbles?: () => void;
}

export const RightSidePanelInspector: React.FC<RightSidePanelInspectorProps> = ({
  seriesId,
  seriesTitle,
  formatType,
  sessionNumber,
  chapterNumber,
  chapters,
  onSelectChapter,
  selectedPanelIdx,
  totalPanels,
  panel,
  cast = [],
  imageModel,
  isRegenerating,
  onSelectPanelIdx,
  onUpdatePanel,
  onRegenerateVisual,
  onSynthesizeAudio,
  onClose,
  addNotification,
  onSynthesizeChapterVisuals,
  isSynthesizingVisuals,
  onSynthesizeChapterAudio,
  isSynthesizingAudio,
  onOpenCharacterVault,
  onOpenWorldBible,
  showSpeechBubbles,
  onToggleSpeechBubbles,
}) => {
  const [activeTab, setActiveTab] = useState<"visual" | "dialogue">("visual");

  // Local editing states
  const [prompt, setPrompt] = useState(panel?.prompt || "");
  const [cameraAngle, setCameraAngle] = useState(panel?.camera_angle || "medium_shot_entry");
  const [motionPrompt, setMotionPrompt] = useState(panel?.motion_prompt || "");
  const [speaker, setSpeaker] = useState(
    panel?.speech_bubbles?.[0]?.speaker_name || "Hero"
  );
  const [speechText, setSpeechText] = useState(panel?.speech_text || "");
  const [bubbleType, setBubbleType] = useState<string>(
    panel?.speech_bubbles?.[0]?.bubble_type || "speech"
  );

  // Sync state whenever panel changes
  useEffect(() => {
    if (panel) {
      setPrompt(panel.prompt || "");
      setCameraAngle(panel.camera_angle || "medium_shot_entry");
      setMotionPrompt(panel.motion_prompt || "");
      setSpeechText(panel.speech_text || "");
      const b = panel.speech_bubbles?.[0];
      if (b) {
        setSpeaker(b.speaker_name || "Hero");
        setBubbleType(b.bubble_type || "speech");
      }
    }
  }, [panel, selectedPanelIdx]);

  // Auto-sync updates to parent whenever parameters change
  const prevPanelIdxRef = useRef(selectedPanelIdx);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (prevPanelIdxRef.current !== selectedPanelIdx) {
      prevPanelIdxRef.current = selectedPanelIdx;
      return;
    }

    const updatedBubble: InteractiveSpeechBubble = {
      bubble_id: panel?.speech_bubbles?.[0]?.bubble_id || `bubble_${Date.now()}`,
      speaker_name: speaker,
      text: speechText,
      bubble_type: bubbleType,
      pos_x: panel?.speech_bubbles?.[0]?.pos_x ?? 0.5,
      pos_y: panel?.speech_bubbles?.[0]?.pos_y ?? 0.75,
      width: panel?.speech_bubbles?.[0]?.width ?? 220,
      height: panel?.speech_bubbles?.[0]?.height ?? 90,
      font_family: "font-comic",
      font_size: 14,
      bg_color: bubbleType === "shout" ? "#FFE4E6" : "#FFFFFF",
      text_color: "#0F172A",
      border_color: "#1E293B",
    };

    onUpdatePanel({
      prompt,
      camera_angle: cameraAngle,
      motion_prompt: motionPrompt,
      speech_text: speechText,
      speech_bubbles: [updatedBubble],
    });
  }, [prompt, cameraAngle, motionPrompt, speaker, speechText, bubbleType, selectedPanelIdx]);

  return (
    <div className="relative h-full min-h-0 max-h-full flex shrink-0 z-20">
      {/* ── Middle Collapse Trigger (Close Inspector) ── */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-16 rounded-l-xl bg-[#181818] hover:bg-[#222222] border-y border-l border-[#2F2F2F] hover:border-blue-400 text-neutral-400 hover:text-blue-300 flex items-center justify-center shadow-[-4px_0_15px_rgba(0,0,0,0.6)] transition-all cursor-pointer group"
          title="Close Inspector"
          aria-label="Close Inspector"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <aside className="w-80 lg:w-[380px] bg-[#121212] border-l border-[#262626] flex flex-col h-full min-h-0 max-h-full overflow-hidden text-left shadow-2xl">
        {/* ── HEADER TIER 1: Primary Shot Navigator ── */}
        <div className="h-12 px-3 border-b border-[#262626] flex items-center justify-between bg-gradient-to-b from-[#181818] to-[#141414] shrink-0">
          {/* Left: Shot Identification & Counter */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-blue-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)] shrink-0 overflow-hidden aspect-square">
              <img
                src="/logo-dark.png"
                alt="Sonikoma"
                className="w-full h-full object-cover scale-[1.22] rounded-full aspect-square select-none pointer-events-none"
                draggable={false}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-white">
                  Shot #{selectedPanelIdx + 1}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30 shrink-0">
                  {selectedPanelIdx + 1} / {totalPanels}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Camera className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-300 capitalize truncate block max-w-[140px]">
                  {cameraAngle.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Shot Steppers & Close Trigger */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectPanelIdx?.(Math.max(0, selectedPanelIdx - 1))}
              disabled={selectedPanelIdx === 0}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Shot"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPanelIdx?.(Math.min(totalPanels - 1, selectedPanelIdx + 1))}
              disabled={selectedPanelIdx >= totalPanels - 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next Shot"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="grid grid-cols-2 p-1.5 gap-1.5 border-b border-[#262626] bg-[#141414] shrink-0">
          {[
            { id: "visual", label: "Visuals", icon: Sparkles, activeCls: "bg-blue-600/25 border-blue-500/50 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]" },
            { id: "dialogue", label: "Speech", icon: MessageSquare, activeCls: "bg-indigo-600/25 border-indigo-500/50 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? tab.activeCls
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Inspector Content Deck ── */}
        <div
          id="shot-director-inspector-scroll-deck"
          className="flex-1 min-h-0 max-h-full overflow-y-auto p-4 space-y-5 studio-visible-scrollbar inspector-visible-scrollbar overscroll-contain"
          tabIndex={0}
          style={{
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {/* TAB 1: VISUAL GENERATION */}
          {activeTab === "visual" && (
            <VisualsTab
              prompt={prompt}
              setPrompt={setPrompt}
              selectedPanelIdx={selectedPanelIdx}
              totalPanels={totalPanels}
              isRegenerating={isRegenerating}
              onRegenerateVisual={onRegenerateVisual}
              onSynthesizeChapterVisuals={onSynthesizeChapterVisuals}
              isSynthesizingVisuals={isSynthesizingVisuals}
              addNotification={addNotification}
            />
          )}

          {/* TAB 2: DIALOGUE & SPEECH */}
          {activeTab === "dialogue" && (
            <SpeechTab
              seriesId={seriesId}
              chapterNumber={chapterNumber}
              selectedPanelIdx={selectedPanelIdx}
              panel={panel}
              cast={cast}
              speaker={speaker}
              setSpeaker={setSpeaker}
              speechText={speechText}
              setSpeechText={setSpeechText}
              bubbleType={bubbleType}
              setBubbleType={setBubbleType}
              onUpdatePanel={onUpdatePanel}
              addNotification={addNotification}
            />
          )}
        </div>
      </aside>
    </div>
  );
};

export default RightSidePanelInspector;

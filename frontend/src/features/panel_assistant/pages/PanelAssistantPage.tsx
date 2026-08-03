import React, { useState, useEffect, useRef } from "react";
import { Sparkles, BookOpenText, Mic2, Wand2, Gauge, ChevronLeft, ChevronRight } from "lucide-react";
import { GeneratedPanel } from "@/types";

import PanelTranslationTool from "@/features/panel_assistant/components/PanelTranslationTool";
import PanelAudioTool from "@/features/panel_assistant/components/PanelAudioTool";
import PanelCreativeTool from "@/features/panel_assistant/components/PanelCreativeTool";
import PanelPacingTool from "@/features/panel_assistant/components/PanelPacingTool";

interface PanelAssistantPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const PanelAssistantPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
  }: PanelAssistantPageProps) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<
      "translation" | "audio" | "creative" | "pacing"
    >("translation");

    const filmstripRef = useRef<HTMLDivElement>(null);

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    const tabs = [
      {
        id: "translation" as const,
        label: "Translation",
        description: "Translate and scrub dialogue",
        icon: BookOpenText,
      },
      {
        id: "audio" as const,
        label: "Audio & TTS",
        description: "Shape sound and voice direction",
        icon: Mic2,
      },
      {
        id: "creative" as const,
        label: "Creative Prompts",
        description: "Compose image and subtitle prompts",
        icon: Wand2,
      },
      {
        id: "pacing" as const,
        label: "Pacing & Shake",
        description: "Tune timing and motion effects",
        icon: Gauge,
      },
    ];

    const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

    // Sync index from URL query param if present
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const idxVal = params.get("idx");
      if (idxVal !== null) {
        const parsed = parseInt(idxVal);
        if (!isNaN(parsed) && parsed >= 0 && parsed < panels.length) {
          setSelectedIdx(parsed);
        }
      }
    }, [panels.length]);

    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start editing.
          </p>
        </div>
      );
    }

    const activePanel = panels[selectedIdx];

    const handleUpdateDialogue = (val: string) => {
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === selectedIdx ? { ...p, speech_text: val } : p
        )
      );
    };

    const handleUpdateNarrative = (val: string) => {
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === selectedIdx ? { ...p, narrative: val, narrative_audio_url: undefined } : p
        )
      );
    };

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  VISUAL STUDIO
                </span>
                <span className="text-xs text-neutral-400 font-mono">• Selected Panel #{activePanel.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Panel Assistant
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Direct panel dialogue translation, TTS speech synthesis, prompt engineering, and frame pacing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Panel {selectedIdx + 1} of {panels.length}</span>
            </div>
          </div>
        </div>

        {/* PANEL HORIZONTAL RIBBON SELECTOR WITH ARROWS */}
        <div className="relative flex items-center bg-[#0d0b16] border border-[#1f1b2e] rounded-2xl p-2.5">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer mr-2 shadow-md"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={filmstripRef}
            className="flex gap-3 overflow-x-auto py-1 scrollbar-none flex-1 scroll-smooth"
          >
            {panels.map((panel, idx) => (
              <button
                key={panel.id}
                onClick={() => {
                  setSelectedIdx(idx);
                  window.history.replaceState(
                    {},
                    "",
                    `/panel-assistant?idx=${idx}`
                  );
                }}
                className={`w-20 shrink-0 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-[#06050a] ${
                  selectedIdx === idx
                    ? "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-105 bg-[#171329]"
                    : "border-[#1e1930] opacity-50 hover:opacity-100 hover:border-purple-500/40"
                }`}
              >
                <img
                  src={panel.image_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-300 border border-neutral-800">
                  #{panel.id}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip("right")}
            className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer ml-2 shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* DUAL / TRIPLE COLUMN STUDIO CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Panel Preview & Inputs */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 space-y-4 shadow-xl">
            <div className="h-52 sm:h-60 rounded-xl overflow-hidden border border-[#221d33] bg-[#06050a] flex items-center justify-center p-2 relative">
              <img
                src={activePanel.image_url}
                alt=""
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                ACTIVE DIALOGUE
              </span>
              <textarea
                value={activePanel.speech_text || ""}
                onChange={(e) => handleUpdateDialogue(e.target.value)}
                rows={3}
                placeholder="(Silent panel script)"
                className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                NARRATIVE TEXT
              </span>
              <textarea
                value={activePanel.narrative || ""}
                onChange={(e) => handleUpdateNarrative(e.target.value)}
                rows={3}
                placeholder="(No narrative voiceover text generated yet)"
                className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column Grid: Studio Tools & Active Workflow */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Middle Pane: Studio Tools */}
            <div className="md:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl">
              <div className="mb-3 px-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  STUDIO TOOLS
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-white">
                  Shape each panel
                </h3>
              </div>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-all cursor-pointer ${
                        isActive
                          ? "border-2 border-purple-500/80 bg-purple-500/15 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                          : "border-[#1c182b] bg-[#07060c] text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "text-purple-300" : "text-neutral-500"
                          }`}
                        />
                        <span className="text-xs font-bold">
                          {tab.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-neutral-400 font-mono">
                        {tab.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Active Workflow Canvas */}
            <div className="md:col-span-8 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b172b] pb-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                    ACTIVE WORKFLOW
                  </p>
                  <h4 className="text-sm font-bold text-white">
                    {activeTabMeta.label}
                  </h4>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {activeTabMeta.description}
                  </p>
                </div>
                <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-purple-300">
                  PANEL {activePanel.id}
                </div>
              </div>

              <div className="flex-1">
                <div className={activeTab === "translation" ? "block" : "hidden"}>
                  <PanelTranslationTool
                    panel={activePanel}
                    panels={panels}
                    setPanels={setPanels}
                    onUpdateDialogue={handleUpdateDialogue}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "audio" ? "block" : "hidden"}>
                  <PanelAudioTool
                    panel={activePanel}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "creative" ? "block" : "hidden"}>
                  <PanelCreativeTool
                    panel={activePanel}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "pacing" ? "block" : "hidden"}>
                  <PanelPacingTool
                    panel={activePanel}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default PanelAssistantPage;


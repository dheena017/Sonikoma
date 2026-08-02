import React, { useState, useEffect } from "react";
import { Sparkles, BookOpenText, Mic2, Wand2, Gauge } from "lucide-react";
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
      <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">

        {/* PANEL HORIZONTAL RIBBON SELECTOR */}

        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
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
              className={`w-20 shrink-0 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-black/40 ${
                selectedIdx === idx
                  ? "border-purple-500 shadow-md shadow-purple-900/30 scale-102 bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950/60 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={panel.image_url}
                alt=""
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono font-bold text-neutral-300">
                #{panel.id}
              </div>
            </button>
          ))}
        </div>

        {/* DUAL COLUMN PANEL PREVIEW & ACTIVE TAB CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left pane: Active Panel Card preview */}
          <div className="md:col-span-4 rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-950/90 via-neutral-900/80 to-purple-950/25 p-4 space-y-4 shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
            <div className="h-44 sm:h-48 rounded-2xl overflow-hidden border border-neutral-800/90 bg-gradient-to-br from-neutral-900 via-neutral-950 to-purple-950/30 flex items-center justify-center">
              <img
                src={activePanel.image_url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                Active Dialogue
              </span>
              <textarea
                value={activePanel.speech_text || ""}
                onChange={(e) => handleUpdateDialogue(e.target.value)}
                rows={2}
                placeholder="(Silent panel script)"
                className="w-full bg-neutral-950/70 border border-neutral-800/80 text-[11px] rounded-xl p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                Narrative Text
              </span>
              <textarea
                value={activePanel.narrative || ""}
                onChange={(e) => handleUpdateNarrative(e.target.value)}
                rows={2}
                placeholder="(No narrative voiceover text generated yet)"
                className="w-full bg-neutral-950/70 border border-neutral-800/80 text-[11px] rounded-xl p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none"
              />
            </div>
          </div>

          {/* Right pane: Tool Tab Selector & Form views */}
          <div className="md:col-span-8 rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-950/90 via-neutral-900/80 to-purple-950/25 p-4 space-y-4 shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-3">
                <div className="mb-3 px-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">
                    Studio tools
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-white">
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
                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? "border-purple-500/60 bg-purple-500/15 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.2)]"
                            : "border-neutral-800/80 bg-neutral-900/70 text-neutral-400 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`h-4 w-4 ${
                              isActive ? "text-purple-300" : "text-neutral-500"
                            }`}
                          />
                          <span className="text-[11px] font-semibold">
                            {tab.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">
                          {tab.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">
                      Active workflow
                    </p>
                    <h4 className="text-sm font-semibold text-white">
                      {activeTabMeta.label}
                    </h4>
                    <p className="mt-1 text-xs text-neutral-400">
                      {activeTabMeta.description}
                    </p>
                  </div>
                  <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-purple-300">
                    Panel {activePanel.id}
                  </div>
                </div>

                <div className="pt-4">
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
      </div>
    );
  }
);

export default PanelAssistantPage;

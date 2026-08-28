import React, { useMemo, useCallback } from "react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import {
  Sparkles,
  Film,
  Globe,
  Music,
  Mic,
  BarChart3,
  Youtube,
} from "lucide-react";
import CreativeSuiteDashboardStats from "@/features/creative_suite/components/CreativeSuiteDashboardStats";
import CreativeSuiteDashboardTools from "@/features/creative_suite/components/CreativeSuiteDashboardTools";
import CreativeSuiteDashboardActiveProject from "@/features/creative_suite/components/CreativeSuiteDashboardActiveProject";
import CreativeSuiteDashboardActivityLog from "@/features/creative_suite/components/CreativeSuiteDashboardActivityLog";

interface CreativeSuiteDashboardPageProps {
  user?: any;
  navigateTo: (path: string) => void;
  panels?: any[];
  setPanels?: (panels: any[]) => void;
  projectId?: string | null;
  seriesTitle?: string | null;
  chapterTitle?: string | null;
  seriesCoverImage?: string | null;
  addNotification?: any;
}

const CreativeSuiteDashboardPage: React.FC<CreativeSuiteDashboardPageProps> = ({
  navigateTo,
  panels = [],
  setPanels,
  addNotification = () => {},
}) => {
  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const clearActiveProject = useProjectStore(
    (state) => state.clearActiveProject
  );
  const activeProject = activeProjectData?.project || null;
  const activePanels = useMemo(() => {
    if (activeProjectData?.panels && activeProjectData.panels.length > 0) {
      return activeProjectData.panels;
    }
    if (Array.isArray(panels) && panels.length > 0) {
      return panels;
    }
    return [];
  }, [activeProjectData?.panels, panels]);

  const exitActiveProject = useCallback(() => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Exit the active project? This will clear the current Creative Suite session and return you to Projects."
      );
      if (!confirmed) {
        return;
      }
    }

    clearActiveProject();
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_project_id");
      localStorage.removeItem("active_series_slug");
      localStorage.removeItem("active_chapter_slug");
    }

    if (typeof setPanels === "function") {
      setPanels([]);
    }

    addNotification?.("Exited the active project.", "success");
    navigateTo("/projects");
  }, [addNotification, clearActiveProject, navigateTo, setPanels]);

  // Stats calculations
  const totalPanelsCount = activePanels.length;
  const totalAudioSeconds = useMemo(() => {
    if (activePanels.length === 0) return 0;
    return activePanels.reduce(
      (acc, panel) => acc + (panel.duration || 3.0),
      0
    );
  }, [activePanels]);

  const statsRibbon = [
    {
      label: "Audio Compiled",
      value:
        totalAudioSeconds > 0 ? `${totalAudioSeconds.toFixed(1)}s` : "0.0s",
      desc: "Soundtrack & Voice tracks",
      icon: Music,
      color: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20",
    },
    {
      label: "Timeline Panels",
      value: totalPanelsCount.toString(),
      desc: "Active storyboard frames",
      icon: Film,
      color: "text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20",
    },
    {
      label: "Engagement Score",
      value: totalPanelsCount > 0 ? "88.4%" : "N/A",
      desc: "Predicted CTR rating",
      icon: BarChart3,
      color: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20",
    },
    {
      label: "AI Processing Load",
      value: "Idle",
      desc: "No active compiles",
      icon: Sparkles,
      color: "text-[#00FFFF] bg-[#00FFFF]/10 border-[#00FFFF]/20",
    },
  ];

  const tools = [
    {
      id: "optimizer",
      label: "Video Optimizer",
      desc: "Configure dimensions, sync frame timings, and render video outputs.",
      icon: Film,
      path: "/creative-suite/ai-optimizer",
      requiresPanels: true,
      badge: "Visual",
    },
    {
      id: "assistant",
      label: "Translation Studio",
      desc: "Multi-language dialogue and narrative translator per panel frame.",
      icon: Globe,
      path: "/creative-suite/panel-assistant",
      requiresPanels: true,
      badge: "Visual",
    },
    {
      id: "voice",
      label: "Voice & Sound Studio",
      desc: "Cast AI voice actors, dramatize dialogue scripts, select background soundtrack loops, and schedule SFX overlays.",
      icon: Mic,
      path: "/creative-suite/ai-voice",
      requiresPanels: true,
      badge: "Audio Production",
    },
    {
      id: "youtube",
      label: "YouTube Publisher",
      desc: "Push completed video exports to YouTube Shorts or channel feed.",
      icon: Youtube,
      path: "/creative-suite/youtube",
      requiresPanels: false,
      badge: "Distribution",
    },
  ];

  const recentActivities = [
    {
      time: "2 mins ago",
      text: "Synthesized text-to-speech dialogue for chapter 3 panel #5",
      type: "voice",
    },
    {
      time: "15 mins ago",
      text: "Translated Solo Leveling script to Portuguese (Brazil)",
      type: "translation",
    },
    {
      time: "1 hour ago",
      text: "Cropped 12 speech bubbles via Bubble Clean AI filter",
      type: "cleaner",
    },
    {
      time: "3 hours ago",
      text: "Composed ambient synth-wave theme inside Sound Lab",
      type: "music",
    },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto animate-fade-in text-left">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Welcome Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F] relative z-10">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight">
              Creative{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF]">
                Suite
              </span>
            </h1>
            <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-xl">
              Fine-tune visual boundaries, compose orchestral backings, cast AI narrators, and translate speech dialogues.
            </p>
          </div>
        </div>

        {/* Statistics Ribbon */}
        <div className="relative z-10">
          <CreativeSuiteDashboardStats stats={statsRibbon} />
        </div>

        {/* Main Grid: Launcher and Project Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono pl-1">
              Creative AI Tools Launcher
            </h3>
            <CreativeSuiteDashboardTools
              tools={tools}
              activePanelsCount={activePanels.length}
              navigateTo={navigateTo}
            />
          </div>

          <div className="space-y-6">
            <CreativeSuiteDashboardActiveProject
              activeProject={activeProject}
              panels={activePanels}
              activePanelsCount={activePanels.length}
              exitActiveProject={exitActiveProject}
              navigateTo={navigateTo}
            />
            <CreativeSuiteDashboardActivityLog activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeSuiteDashboardPage;

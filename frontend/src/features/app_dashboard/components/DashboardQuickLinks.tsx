import React from "react";
import { ArrowUpRight, AudioLines, Clapperboard, WandSparkles, Sparkles } from "lucide-react";

interface DashboardQuickLinksProps {
  onGoToAudioLab: () => void;
  onGoToPanelAssistant: () => void;
  onGoToVideoOptimizer: () => void;
  onOpenStoryStudio?: () => void;
}

export default function DashboardQuickLinks({
  onGoToAudioLab,
  onGoToPanelAssistant,
  onGoToVideoOptimizer,
  onOpenStoryStudio,
}: DashboardQuickLinksProps) {
  const handleOpenStoryStudio = () => {
    if (onOpenStoryStudio) onOpenStoryStudio();
    else window.dispatchEvent(new CustomEvent("sonikoma:open-create-series"));
  };

  const actions = [
    { label: "AI Story Studio", icon: Sparkles, onClick: handleOpenStoryStudio, color: "text-purple-400" },
    { label: "Voice studio", icon: AudioLines, onClick: onGoToAudioLab, color: "text-emerald-300" },
    { label: "Panel assistant", icon: WandSparkles, onClick: onGoToPanelAssistant, color: "text-amber-300" },
    { label: "Video optimizer", icon: Clapperboard, onClick: onGoToVideoOptimizer, color: "text-sky-300" },
  ];

  return (
    <nav aria-label="Creative tools" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(({ label, icon: Icon, onClick, color }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="group flex min-h-12 items-center gap-3 rounded-lg border border-white/10 bg-[#141414] px-4 text-left transition-colors hover:border-white/20 hover:bg-[#1b1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 cursor-pointer"
        >
          <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#D4D4D8] group-hover:text-white">
            {label}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#71717A] transition-colors group-hover:text-white" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

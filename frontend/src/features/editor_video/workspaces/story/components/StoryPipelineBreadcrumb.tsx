import React from "react";
import { ChevronRight } from "lucide-react";

interface PipelineStep {
  label: string;
  active: boolean;
}

interface StoryPipelineBreadcrumbProps {
  steps: PipelineStep[];
}

export const StoryPipelineBreadcrumb: React.FC<StoryPipelineBreadcrumbProps> = ({ steps }) => {
  return (
    <div className="px-3 py-2 bg-purple-950/30 border-b border-purple-900/40 shrink-0">
      <div className="flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div
              className={`flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all whitespace-nowrap ${
                step.active
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                  : "text-neutral-500 border border-transparent"
              }`}
            >
              <span>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-2.5 w-2.5 text-purple-500/40 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

import React from "react";
import { ChevronRight } from "lucide-react";

interface PipelineStep {
  label: string;
  active: boolean;
}

interface StoryPipelineBreadcrumbProps {
  steps: PipelineStep[];
}

export const StoryPipelineBreadcrumb: React.FC<
  StoryPipelineBreadcrumbProps
> = ({ steps }) => {
  return (
    <div className="px-3 py-2 bg-[#08050e]/90 border-b border-[#2F2F2F] shrink-0">
      <div className="flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div
              className={`flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full transition-all whitespace-nowrap ${
                step.active
                  ? "bg-[#2A2A2A] text-[#3B82F6] border border-[#3B82F6]/30 "
                  : "text-neutral-500 border border-transparent"
              }`}
            >
              <span>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-2.5 w-2.5 text-[#3B82F6]/40 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

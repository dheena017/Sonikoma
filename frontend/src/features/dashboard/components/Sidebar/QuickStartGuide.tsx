import React from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export interface OnboardingTask {
  id: number;
  text: string;
  completed: boolean;
}

interface QuickStartGuideProps {
  onboardingTasks: OnboardingTask[];
}

export default function QuickStartGuide({ onboardingTasks }: QuickStartGuideProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-20 w-20 text-purple-400" />
      </div>
      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-purple-400" />
        Quick Start Guide
      </h3>

      <div className="space-y-3 relative z-10">
        {onboardingTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-neutral-600 shrink-0" />
            )}
            <span
              className={`text-xs font-medium ${
                task.completed
                  ? "text-neutral-400 line-through"
                  : "text-neutral-200"
              }`}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>

      {onboardingTasks.length > 0 && onboardingTasks.every((t) => t.completed) && (
        <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Level 1 Creator Achieved!
          </p>
        </div>
      )}
    </div>
  );
}

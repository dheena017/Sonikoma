import React from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export interface OnboardingTask {
  id: number;
  text: string;
  completed: boolean;
}

interface QuickStartGuideProps {
  onboardingTasks?: OnboardingTask[];
  onNavigate?: (path: string) => void;
}

const taskNavigationMap: Record<number, string> = {
  1: "/creative-suite",
  2: "/creative-suite/panel-assistant",
  3: "/creative-suite/ai-voice",
  4: "/creative-suite/youtube",
};

export default function QuickStartGuide({
  onboardingTasks = [],
  onNavigate,
}: QuickStartGuideProps) {
  const completedCount = onboardingTasks.filter((task) => task.completed).length;
  const allCompleted = onboardingTasks.length > 0 && completedCount === onboardingTasks.length;

  const handleTaskClick = (taskId: number) => {
    const path = taskNavigationMap[taskId];
    if (path && onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-20 w-20 text-purple-400" />
      </div>

      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2 relative z-10">
        <CheckCircle2 className="h-4 w-4 text-purple-400" />
        Quick Start Guide
      </h3>

      <div className="space-y-3 relative z-10">
        {onboardingTasks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-400 text-center">
            Start by creating your first project to unlock onboarding steps.
          </div>
        ) : (
          onboardingTasks.map((task) => {
            const isClickable = !task.completed && Boolean(onNavigate) && Boolean(taskNavigationMap[task.id]);

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => handleTaskClick(task.id)}
                disabled={!isClickable}
                className={`flex items-center gap-3 w-full text-left ${
                  isClickable ? "hover:bg-white/10" : ""
                }`}
              >
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
              </button>
            );
          })
        )}
      </div>

      {allCompleted && (
        <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center relative z-10">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Studio Ready
          </p>
        </div>
      )}
    </div>
  );
}

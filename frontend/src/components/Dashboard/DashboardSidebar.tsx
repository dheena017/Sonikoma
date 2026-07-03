import React from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Circle,
  Cpu,
  FileText,
  Settings,
  Sliders,
  Sparkles,
  ChevronRight,
  Volume2,
} from "lucide-react";

interface OnboardingTask {
  id: number;
  text: string;
  completed: boolean;
}

interface DashboardSidebarProps {
  onboardingTasks: OnboardingTask[];
  latency: number | null;
  metrics: any;
  analytics: any;
  onNavigate: (path: string) => void;
}

export default function DashboardSidebar({
  onboardingTasks,
  latency,
  metrics,
  analytics,
  onNavigate,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6">
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

        {onboardingTasks.every((t) => t.completed) && (
          <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Level 1 Creator Achieved!
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Engine Status
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Computational Server</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">API Health Latency</span>
            <span className="text-neutral-300 font-bold">
              {latency !== null ? `${latency}ms` : "Checking..."}
            </span>
          </div>

          <hr className="border-white/5" />

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 font-mono block">
              Active Worker Pipelines
            </span>

            <div className="space-y-2.5 mt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Browser Scraping</span>
                <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Panel Segmentor</span>
                <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Speech OCR Models</span>
                <span className="text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/30 font-bold text-[9px] uppercase">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">TTS Audio Engine</span>
                <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider font-mono flex items-center gap-2">
          <Cpu className="h-4 w-4 text-purple-400" />
          System Resources
        </h3>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                Memory Usage
              </span>
              <span className="text-xs font-mono text-neutral-300">
                {metrics?.memory?.rssMB ? `${metrics.memory.rssMB} MB` : "---"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
                style={{ width: metrics?.memory?.systemUsedPct || "0%" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                CPU Load
              </span>
              <span className="text-xs font-mono text-neutral-300">
                {metrics?.memory?.cpuPct ? `${metrics.memory.cpuPct}%` : "---"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
                style={{ width: `${metrics?.memory?.cpuPct || 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                Storage Usage
              </span>
              <span className="text-xs font-mono text-neutral-300">
                {metrics?.storage?.usedBytes
                  ? `${(metrics.storage.usedBytes / (1024 * 1024)).toFixed(1)} MB`
                  : "---"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                style={{
                  width: `${
                    metrics?.storage?.usedBytes && metrics?.storage?.limitBytes
                      ? (metrics.storage.usedBytes / metrics.storage.limitBytes) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                AI Tokens Used
              </span>
              <span className="text-xs font-mono text-neutral-300">
                {analytics?.total_tokens ? analytics.total_tokens.toLocaleString() : "0"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000"
                style={{
                  width: `${Math.min(100, (analytics?.total_tokens || 0) / 10000)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-400" />
          Guides & Reference
        </h3>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate("/shortcuts")}
            className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-900/10 border border-purple-500/10 flex items-center justify-center text-purple-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Keyboard Shortcuts</h4>
                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                  Quickly edit storyboards & camera sweeps
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => onNavigate("/settings")}
            className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-900/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pipeline Settings</h4>
                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                  Configure OCR & voice models
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-indigo-400 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => onNavigate("/logs")}
            className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-900/10 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">System Output Logs</h4>
                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                  Examine processing execution in real-time
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

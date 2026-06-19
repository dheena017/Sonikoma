import React, { useState, useEffect } from "react";
import { Cpu, Globe, Sparkles, Film, CheckCircle2 } from "lucide-react";

interface ProcessBarProps {
  progressStatus: string;
}

interface StepInfo {
  label: string;
  desc: string;
  icon: React.ReactNode;
}

export default function ProcessBar({ progressStatus }: ProcessBarProps) {
  // 1. Define the 5 major pipeline stages
  const steps: StepInfo[] = [
    {
      label: "Init",
      desc: "Connecting",
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
    {
      label: "Scrape",
      desc: "Downloading",
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      label: "AI Analyze",
      desc: "OCR & Prompts",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      label: "Render",
      desc: "MoviePy Sync",
      icon: <Film className="w-3.5 h-3.5" />,
    },
    {
      label: "Compile",
      desc: "Done",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  // 2. Map progress status string to target percentage and active step
  const statusLower = (progressStatus || "").toLowerCase();
  let targetPercent = 10;
  let activeStep = 0;

  if (
    statusLower.includes("contacting") ||
    statusLower.includes("initiat") ||
    statusLower.includes("queue")
  ) {
    targetPercent = 15;
    activeStep = 0;
  } else if (
    statusLower.includes("scrap") ||
    statusLower.includes("crawl") ||
    statusLower.includes("download")
  ) {
    targetPercent = 40;
    activeStep = 1;
  } else if (
    statusLower.includes("ocr") ||
    statusLower.includes("analy") ||
    statusLower.includes("vision") ||
    statusLower.includes("storyboard")
  ) {
    targetPercent = 65;
    activeStep = 2;
  } else if (
    statusLower.includes("compil") ||
    statusLower.includes("moviepy") ||
    statusLower.includes("render") ||
    statusLower.includes("stitch") ||
    statusLower.includes("synthes")
  ) {
    targetPercent = 85;
    activeStep = 3;
  } else if (
    statusLower.includes("map") ||
    statusLower.includes("finished") ||
    statusLower.includes("success") ||
    statusLower.includes("generated") ||
    statusLower.includes("completed")
  ) {
    targetPercent = 100;
    activeStep = 4;
  }

  // 3. Smooth crawling state (increases percentage slowly during long waits)
  const [displayPercent, setDisplayPercent] = useState(targetPercent);

  useEffect(() => {
    // Sync immediate jumps when switching stages
    setDisplayPercent(targetPercent);
  }, [targetPercent]);

  useEffect(() => {
    if (displayPercent >= 100 || displayPercent >= targetPercent + 18) return;
    
    const interval = setInterval(() => {
      setDisplayPercent((prev) => {
        const cap = targetPercent === 100 ? 100 : Math.min(targetPercent + 18, 99);
        if (prev < cap) {
          return parseFloat((prev + 0.4).toFixed(1));
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [targetPercent, displayPercent]);

  return (
    <div className="space-y-6 w-full">
      {/* 5-Stage Visual Stepper */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 select-none">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          const isPending = idx > activeStep;

          return (
            <div
              key={step.label}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-300 relative ${
                isActive
                  ? "bg-purple-950/20 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] scale-[1.03]"
                  : isCompleted
                  ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400"
                  : "bg-neutral-950/40 border-neutral-850 text-neutral-600"
              }`}
            >
              {/* Step Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-neutral-900 text-neutral-500"
                }`}
              >
                {step.icon}
              </div>

              {/* Step Label */}
              <span className="text-[10px] font-black uppercase tracking-wider mt-2 hidden sm:inline">
                {step.label}
              </span>
              <span className="text-[8px] font-medium text-neutral-500 mt-0.5 leading-none text-center hidden md:inline">
                {step.desc}
              </span>

              {/* Status Ping for active step */}
              {isActive && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Creeping Glowing Progress Bar */}
      <div className="space-y-2.5">
        <div className="relative h-3 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-850 shadow-inner">
          {/* Main Gradient Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_14px_rgba(99,102,241,0.6)]"
            style={{ width: `${displayPercent}%` }}
          />

          {/* Shimmer sweeping effect */}
          {activeStep < 4 && (
            <div
              className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-full animate-shimmer-sweep"
              style={{ left: `${displayPercent - 40}%` }}
            />
          )}
        </div>

        {/* Telemetry percentage readout */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 px-1">
          <span className="animate-pulse text-purple-400/80">
            {activeStep === 4 ? "Compilation Finished" : "Asynchronous Compilation Running..."}
          </span>
          <span className="text-white bg-neutral-900/80 border border-neutral-800/60 px-2 py-0.5 rounded-full shadow-inner">
            {Math.round(displayPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}

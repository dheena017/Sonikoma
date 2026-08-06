import React, { useState, useEffect } from "react";

interface ProcessBarProps {
  progressStatus?: string | null;
}

export default function ProcessBar({ progressStatus }: ProcessBarProps) {
  const statusLower =
    typeof progressStatus === "string" ? progressStatus.toLowerCase() : "";

  let targetPercent = 10;
  let statusLabel = "Initialising…";

  if (
    statusLower.includes("contacting") ||
    statusLower.includes("initiat") ||
    statusLower.includes("queue")
  ) {
    targetPercent = 15;
    statusLabel = "Connecting…";
  } else if (
    statusLower.includes("scrap") ||
    statusLower.includes("crawl") ||
    statusLower.includes("download")
  ) {
    targetPercent = 40;
    statusLabel = "Downloading panels…";
  } else if (
    statusLower.includes("ocr") ||
    statusLower.includes("analy") ||
    statusLower.includes("vision") ||
    statusLower.includes("storyboard")
  ) {
    targetPercent = 65;
    statusLabel = "Analysing & prompting…";
  } else if (
    statusLower.includes("compil") ||
    statusLower.includes("moviepy") ||
    statusLower.includes("render") ||
    statusLower.includes("stitch") ||
    statusLower.includes("synthes")
  ) {
    targetPercent = 85;
    statusLabel = "Rendering video…";
  } else if (
    statusLower.includes("map") ||
    statusLower.includes("finished") ||
    statusLower.includes("success") ||
    statusLower.includes("generated") ||
    statusLower.includes("completed")
  ) {
    targetPercent = 100;
    statusLabel = "Done";
  }

  const [displayPercent, setDisplayPercent] = useState(targetPercent);

  useEffect(() => {
    setDisplayPercent(targetPercent);
  }, [targetPercent]);

  useEffect(() => {
    if (displayPercent >= 100 || displayPercent >= targetPercent + 18) return;
    const interval = setInterval(() => {
      setDisplayPercent((prev) => {
        const cap =
          targetPercent === 100 ? 100 : Math.min(targetPercent + 18, 99);
        return prev < cap ? parseFloat((prev + 0.4).toFixed(1)) : prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [targetPercent, displayPercent]);

  const isDone = targetPercent === 100;

  return (
    <div className="flex items-center gap-3 w-full min-w-0">
      {/* Slim progress bar */}
      <div className="relative flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
            isDone
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-purple-500 to-indigo-400"
          }`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      {/* Status label */}
      <span className="text-[10px] font-mono text-neutral-400 shrink-0 truncate max-w-[120px]">
        {statusLabel}
      </span>

      {/* Percentage */}
      <span className={`text-[10px] font-black font-mono shrink-0 ${isDone ? "text-emerald-400" : "text-purple-300"}`}>
        {Math.round(displayPercent)}%
      </span>
    </div>
  );
}

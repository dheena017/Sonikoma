// ─── TimelineRuler ────────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineRuler.tsx

import React, { useMemo } from "react";

interface TimelineRulerProps {
  totalDuration: number;
  onScrubStart?: (e: React.MouseEvent) => void;
}

function buildTicks(totalDuration: number): { ticks: number[]; interval: number } {
  const interval = totalDuration <= 15 ? 1 : totalDuration <= 60 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration + interval; t += interval) ticks.push(t);
  return { ticks, interval };
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({ totalDuration, onScrubStart }) => {
  const { ticks, interval } = useMemo(() => buildTicks(totalDuration), [totalDuration]);

  return (
    <div
      onMouseDown={(e) => onScrubStart?.(e)}
      className="h-7 flex shrink-0 bg-[#0d0d12] border-b border-white/[0.05] cursor-pointer select-none group/ruler"
    >
      {/* Spacer aligned with the track labels column */}
      <div className="w-28 shrink-0 border-r border-white/[0.05]" />

      <div className="flex-1 relative overflow-hidden">
        {ticks.map((t) => {
          const pct = totalDuration <= 0 ? 0 : (t / totalDuration) * 100;
          const isMinor = interval >= 5 ? t % interval !== 0 : false;
          return (
            <div
              key={t}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${pct}%` }}
            >
              <span className="text-[9px] font-mono text-neutral-500 mb-0.5 -translate-x-1/2 whitespace-nowrap select-none group-hover/ruler:text-purple-300 transition-colors">
                {t === 0 ? "0s" : `${t}s`}
              </span>
              <div className={`w-px ${isMinor ? "h-1.5 bg-white/10" : "h-2.5 bg-white/20"}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TimelineRuler);

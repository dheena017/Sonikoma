// ─── TimelineRuler ────────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineRuler.tsx

import React, { forwardRef, useMemo, useRef } from "react";
import { Clock } from "lucide-react";

interface TimelineRulerProps {
  totalDuration: number;
  onScrubStart?: (e: React.MouseEvent) => void;
  onHoverPctChange?: (pct: number | null) => void;
}

function buildTicks(totalDuration: number): {
  ticks: number[];
  interval: number;
} {
  const interval = totalDuration <= 15 ? 1 : totalDuration <= 60 ? 5 : 10;
  const ticks: number[] = [];
  if (totalDuration <= 0) {
    return { ticks: [0], interval };
  }

  for (let t = 0; t <= totalDuration; t += interval) {
    ticks.push(t);
  }

  const lastTick = ticks[ticks.length - 1];
  if (lastTick < totalDuration) {
    ticks.push(totalDuration);
  }

  return { ticks, interval };
}

const TimelineRuler = forwardRef<HTMLDivElement, TimelineRulerProps>(
  ({ totalDuration, onScrubStart, onHoverPctChange }, ref) => {
    const { ticks, interval } = useMemo(
      () => buildTicks(totalDuration),
      [totalDuration]
    );
    const [hoverPct, setHoverPct] = React.useState<number | null>(null);

    const trackRef = useRef<HTMLDivElement | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, relativeX / Math.max(1, rect.width)));
      const pct100 = pct * 100;
      setHoverPct(pct100);
      onHoverPctChange?.(pct100);
    };

    const handleMouseLeave = () => {
      setHoverPct(null);
      onHoverPctChange?.(null);
    };

    return (
      <div
        ref={ref}
        onMouseDown={(e) => onScrubStart?.(e)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="h-8 flex shrink-0 bg-[#0d0d12] border-b border-white/[0.05] cursor-pointer select-none group/ruler"
      >
        {/* Spacer aligned with the track labels column */}
        <div className="w-28 shrink-0 border-r border-white/[0.05] bg-[#0d0d12] flex items-center justify-center px-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-purple-300" />
            <div>
              <div className="text-[10px] font-semibold text-white">
                Timeline
              </div>
              <div className="text-[9px] text-neutral-500">
                {totalDuration.toFixed(1)}s
              </div>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex-1 relative overflow-hidden pt-1 timeline-ruler-track"
        >
          {hoverPct !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-white/20"
              style={{ left: `${hoverPct}%` }}
            />
          )}

          {ticks.map((t) => {
            const pct = totalDuration <= 0 ? 0 : (t / totalDuration) * 100;
            const isMinor = interval >= 5 ? t % interval !== 0 : false;
            const isFirst = t === 0;
            const isLast = t === totalDuration;
            const translateX = isFirst ? "0%" : isLast ? "-100%" : "-50%";

            return (
              <div
                key={t}
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${pct}%`,
                  transform: `translateX(${translateX})`,
                }}
              >
                <span className="text-[9px] font-mono text-neutral-400 mb-1 whitespace-nowrap select-none group-hover/ruler:text-purple-300 transition-colors">
                  {t === 0 ? "0s" : `${t}s`}
                </span>
                <div
                  className={`w-px ${
                    isMinor ? "h-1.5 bg-white/10" : "h-2.5 bg-white/20"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default React.memo(TimelineRuler);

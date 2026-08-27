// ─── TimelineRuler ────────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelineRuler.tsx
// High-precision NLE ruler with multi-scale minutes, hours, and sub-second subdivisions.

import React, { forwardRef, useMemo, useRef } from "react";
import { Clock } from "lucide-react";

interface TimelineRulerProps {
  totalDuration: number;
  onScrubStart?: (e: React.MouseEvent) => void;
  onHoverPctChange?: (pct: number | null) => void;
}

interface RulerTick {
  time: number;
  pct: number;
  type: "major" | "medium" | "minor";
  label?: string;
}

/** Formats seconds into human-readable NLE timecodes with minutes and hours. */
export function formatTimecode(seconds: number, showDecimal = false): string {
  if (seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const secInt = Math.floor(secs);
  const ms = (secs % 1).toFixed(2).substring(1); // e.g. .25

  if (hours > 0) {
    const minStr = minutes.toString().padStart(2, "0");
    const secStr = secInt.toString().padStart(2, "0");
    return `${hours}:${minStr}:${secStr}${showDecimal ? ms : ""}`;
  }

  if (seconds >= 60) {
    const minStr = minutes.toString();
    const secStr = secInt.toString().padStart(2, "0");
    const decimalPart = showDecimal && secs % 1 !== 0 ? ms : "";
    return `${minStr}:${secStr}${decimalPart}`;
  }

  // Under 60 seconds
  if (seconds === 0) return "0s";
  if (showDecimal && seconds % 1 !== 0) {
    return `${seconds.toFixed(2)}s`;
  }
  return `${seconds % 1 === 0 ? seconds : seconds.toFixed(1)}s`;
}

function buildSubdividedTicks(totalDuration: number): RulerTick[] {
  if (totalDuration <= 0) {
    return [{ time: 0, pct: 0, type: "major", label: "0s" }];
  }

  let majorStep = 1.0;
  let mediumStep = 0.5;
  let minorStep = 0.1;

  if (totalDuration > 3600) {
    // Over 1 hour: Major every 5 mins (300s), Med every 1 min (60s), Minor every 15s
    majorStep = 300.0;
    mediumStep = 60.0;
    minorStep = 15.0;
  } else if (totalDuration > 600) {
    // 10 to 60 mins: Major every 1 min (60s), Med every 30s, Minor every 5s
    majorStep = 60.0;
    mediumStep = 30.0;
    minorStep = 5.0;
  } else if (totalDuration > 120) {
    // 2 to 10 mins: Major every 30s or 15s
    majorStep = 30.0;
    mediumStep = 10.0;
    minorStep = 2.0;
  } else if (totalDuration > 60) {
    // 1 to 2 mins: Major every 10s or 15s, Med every 5s, Minor every 1s
    majorStep = 10.0;
    mediumStep = 5.0;
    minorStep = 1.0;
  } else if (totalDuration > 20) {
    majorStep = 5.0;
    mediumStep = 1.0;
    minorStep = 0.25;
  } else if (totalDuration > 8) {
    majorStep = 1.0;
    mediumStep = 0.5;
    minorStep = 0.1;
  } else {
    majorStep = 0.5;
    mediumStep = 0.25;
    minorStep = 0.05;
  }

  const ticks: RulerTick[] = [];
  const count = Math.round(totalDuration / minorStep);

  for (let i = 0; i <= count; i++) {
    const t = parseFloat((i * minorStep).toFixed(3));
    if (t > totalDuration + 0.001) break;

    const pct = Math.min((t / totalDuration) * 100, 100);
    const isMajor =
      Math.abs(t % majorStep) < 0.001 ||
      Math.abs((t % majorStep) - majorStep) < 0.001 ||
      t === 0 ||
      Math.abs(t - totalDuration) < 0.001;

    const isMedium =
      !isMajor &&
      (Math.abs(t % mediumStep) < 0.001 ||
        Math.abs((t % mediumStep) - mediumStep) < 0.001);

    if (isMajor) {
      ticks.push({
        time: t,
        pct,
        type: "major",
        label: formatTimecode(t),
      });
    } else if (isMedium) {
      ticks.push({
        time: t,
        pct,
        type: "medium",
      });
    } else {
      ticks.push({
        time: t,
        pct,
        type: "minor",
      });
    }
  }

  return ticks;
}

const TimelineRuler = forwardRef<HTMLDivElement, TimelineRulerProps>(
  ({ totalDuration, onScrubStart, onHoverPctChange }, ref) => {
    const ticks = useMemo(
      () => buildSubdividedTicks(totalDuration),
      [totalDuration]
    );

    const [hoverPct, setHoverPct] = React.useState<number | null>(null);
    const [hoverTime, setHoverTime] = React.useState<number | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, relativeX / Math.max(1, rect.width)));
      const pct100 = pct * 100;
      setHoverPct(pct100);
      setHoverTime(pct * totalDuration);
      onHoverPctChange?.(pct100);
    };

    const handleMouseLeave = () => {
      setHoverPct(null);
      setHoverTime(null);
      onHoverPctChange?.(null);
    };

    return (
      <div
        ref={ref}
        onMouseDown={(e) => onScrubStart?.(e)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="h-8 flex shrink-0 bg-[#0a0a10] border-b border-white/[0.06] cursor-pointer select-none group/ruler"
      >
        {/* Spacer aligned with the track labels column */}
        <div className="w-28 shrink-0 border-r border-white/5 bg-[#09090f] flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="h-3 w-3 text-purple-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-neutral-200 truncate">
              Timeline
            </span>
          </div>
          <span className="text-[9px] font-mono text-purple-300/90 shrink-0 font-bold">
            {formatTimecode(totalDuration, true)}
          </span>
        </div>

        {/* High-Precision Subdivided Ruler Rail */}
        <div
          ref={trackRef}
          className="flex-1 relative overflow-hidden h-full timeline-ruler-track"
        >
          {/* Hover Time Scrubber Line & Tooltip */}
          {hoverPct !== null && hoverTime !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-purple-400/50 z-20"
              style={{ left: `${hoverPct}%` }}
            >
              <div className="absolute top-0.5 -translate-x-1/2 px-1.5 py-0.2 rounded bg-purple-600 text-white text-[8px] font-mono font-bold shadow-lg whitespace-nowrap">
                {formatTimecode(hoverTime, true)}
              </div>
            </div>
          )}

          {/* Subdivided Ticks */}
          {ticks.map((tick, idx) => {
            const isFirst = tick.time === 0;
            const isLast = Math.abs(tick.time - totalDuration) < 0.001;
            const translateX = isFirst ? "0%" : isLast ? "-100%" : "-50%";

            if (tick.type === "major") {
              return (
                <div
                  key={`major-${idx}-${tick.time}`}
                  className="absolute bottom-0 flex flex-col items-center pointer-events-none"
                  style={{
                    left: `${tick.pct}%`,
                    transform: `translateX(${translateX})`,
                  }}
                >
                  {tick.label && (
                    <span className="text-[8px] font-mono text-neutral-400 mb-0.5 whitespace-nowrap select-none group-hover/ruler:text-purple-200 transition-colors font-semibold">
                      {tick.label}
                    </span>
                  )}
                  <div className="w-[1px] h-3 bg-white/40 group-hover/ruler:bg-purple-400/80 transition-colors" />
                </div>
              );
            }

            if (tick.type === "medium") {
              return (
                <div
                  key={`med-${idx}-${tick.time}`}
                  className="absolute bottom-0 pointer-events-none"
                  style={{
                    left: `${tick.pct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="w-[1px] h-2 bg-white/20" />
                </div>
              );
            }

            // Minor micro-notch
            return (
              <div
                key={`min-${idx}-${tick.time}`}
                className="absolute bottom-0 pointer-events-none"
                style={{
                  left: `${tick.pct}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-[1px] h-1 bg-white/[0.08]" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default React.memo(TimelineRuler);

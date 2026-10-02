// ─── useAIPacing ─────────────────────────────────────────────────────────────
// Canonical location: timeline/hooks/useAIPacing.ts

import { useMemo } from "react";

export interface AIPacingMetrics {
  avgDuration: number;
  pacingScore: "Fast (Action)" | "Balanced" | "Slow (Dramatic)";
  suggestedTransitions: Array<{
    panelIdx: number;
    suggestion: "Cut" | "Crossfade" | "Zoom Punch";
  }>;
  aiConfidence: number;
}

export function useAIPacing(
  panels: any[],
  clipDurations: Record<string, number>
): AIPacingMetrics {
  return useMemo(() => {
    const total = Math.max(panels.length, 1);
    let sum = 0;
    for (let i = 0; i < total; i++) {
      const d = clipDurations[`v1-${i}`] ?? panels[i]?.duration ?? 0;
      sum += d;
    }
    const avgDuration = parseFloat((sum / total).toFixed(1));

    let pacingScore: AIPacingMetrics["pacingScore"] = "Balanced";
    if (avgDuration < 1.8) pacingScore = "Fast (Action)";
    else if (avgDuration > 3.0) pacingScore = "Slow (Dramatic)";

    const suggestedTransitions = panels.map((_, idx) => ({
      panelIdx: idx,
      suggestion: (idx % 3 === 0
        ? "Zoom Punch"
        : idx % 2 === 0
        ? "Crossfade"
        : "Cut") as "Cut" | "Crossfade" | "Zoom Punch",
    }));

    return {
      avgDuration,
      pacingScore,
      suggestedTransitions,
      aiConfidence: 0.94,
    };
  }, [panels, clipDurations]);
}

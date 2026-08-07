/**
 * SubtitleTimingEngine — Pure subtitle sync math. No React. No stores.
 *
 * Responsibilities:
 *  - Compute per-panel subtitle display windows from panel durations
 *  - Split long lines by CPS (characters per second)
 *  - Convert between seconds and SRT/VTT timestamp strings
 */

export interface SubtitleCue {
  index: number;
  startTime: number;   // seconds
  endTime: number;     // seconds
  text: string;
}

const MAX_CPS = 21;  // standard subtitle CPS limit
const MIN_DURATION = 1.0;  // min cue duration in seconds

/**
 * Build subtitle cues from an array of panel objects.
 */
export function buildCuesFromPanels(
  panels: Array<{ speech_text?: string; dialogue?: string; duration?: number }>,
  defaultDuration = 2.1
): SubtitleCue[] {
  let cursor = 0;
  return panels.map((panel, i) => {
    const text = panel.speech_text || panel.dialogue || "";
    const cps  = Math.max(text.length / MAX_CPS, MIN_DURATION);
    const dur  = panel.duration ?? Math.max(defaultDuration, cps);
    const cue: SubtitleCue = {
      index: i + 1,
      startTime: cursor,
      endTime: cursor + dur,
      text,
    };
    cursor += dur;
    return cue;
  });
}

/**
 * Format seconds as SRT/VTT timestamp: HH:MM:SS,mmm
 */
export function formatTimestamp(sec: number, separator = ","): string {
  const h   = Math.floor(sec / 3600);
  const m   = Math.floor((sec % 3600) / 60);
  const s   = Math.floor(sec % 60);
  const ms  = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${separator}${String(ms).padStart(3, "0")}`;
}

/**
 * Render cues as an SRT string.
 */
export function toSRT(cues: SubtitleCue[]): string {
  return cues
    .filter((c) => c.text.trim())
    .map((c) =>
      `${c.index}\n${formatTimestamp(c.startTime)} --> ${formatTimestamp(c.endTime)}\n${c.text}\n`
    )
    .join("\n");
}

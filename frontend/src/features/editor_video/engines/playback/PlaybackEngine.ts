/**
 * PlaybackEngine — Pure frame scheduling math. No React. No stores.
 *
 * Responsibilities:
 *  - Convert panel index → playhead time
 *  - Convert playhead time → panel index
 *  - Calculate looped playback position
 *  - Frame rate utilities
 */

export interface PlaybackConfig {
  panelCount: number;
  panelDuration: number;  // seconds per panel (default 2.1)
  fps: number;            // frames per second
}

export function totalDuration(config: PlaybackConfig): number {
  return config.panelCount * config.panelDuration;
}

export function panelIndexToTime(index: number, config: PlaybackConfig): number {
  return (index + 0.5) * config.panelDuration;
}

export function timeToPanelIndex(time: number, config: PlaybackConfig): number {
  return Math.floor(time / config.panelDuration);
}

export function loopTime(time: number, config: PlaybackConfig): number {
  const dur = totalDuration(config);
  if (dur <= 0) return 0;
  return time % dur;
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function timeToFrame(time: number, fps: number): number {
  return Math.floor(time * fps);
}

export function formatTimecode(time: number, fps: number): string {
  const h  = Math.floor(time / 3600);
  const m  = Math.floor((time % 3600) / 60);
  const s  = Math.floor(time % 60);
  const f  = Math.floor((time % 1) * fps);
  return [h, m, s, f].map((v, i) => String(v).padStart(i === 3 ? 2 : 2, "0")).join(":");
}

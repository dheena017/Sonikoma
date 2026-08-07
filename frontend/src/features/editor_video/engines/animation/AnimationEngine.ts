/**
 * AnimationEngine — Pure keyframe/easing math. No React. No stores.
 *
 * Responsibilities:
 *  - Interpolate values between keyframes
 *  - Apply named easing functions
 *  - Build motion path coordinates
 */

export type EasingFn = (t: number) => number;

export const Easings: Record<string, EasingFn> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
};

export interface Keyframe {
  time: number;   // seconds
  value: number;
  easing?: keyof typeof Easings;
}

/**
 * Interpolate a numeric value at a given `time` from a keyframe array.
 */
export function interpolate(keyframes: Keyframe[], time: number): number {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  const nextIdx = sorted.findIndex((kf) => kf.time > time);
  const from = sorted[nextIdx - 1];
  const to   = sorted[nextIdx];

  const t = (time - from.time) / (to.time - from.time);
  const ease = Easings[from.easing ?? "linear"];
  const te   = ease(t);

  return from.value + (to.value - from.value) * te;
}

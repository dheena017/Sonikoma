/**
 * TimelineEngine — Pure clip/track math. No React. No stores.
 *
 * Responsibilities:
 *  - Ripple delete: shift all clips after a point
 *  - Snap: find nearest snap point within threshold
 *  - Clip trim: clamp in/out points
 *  - Duration calculation from clip array
 */

export interface Clip {
  id: string;
  trackId: string;
  startTime: number;  // seconds
  duration: number;   // seconds
}

/** Snap a value to the nearest point within `threshold` seconds. */
export function snapToGrid(value: number, snapPoints: number[], threshold = 0.1): number {
  let best = value;
  let minDist = Infinity;
  for (const sp of snapPoints) {
    const dist = Math.abs(value - sp);
    if (dist < threshold && dist < minDist) {
      minDist = dist;
      best = sp;
    }
  }
  return best;
}

/** Ripple-delete: remove clip and shift all subsequent clips on same track. */
export function rippleDelete(clips: Clip[], clipId: string): Clip[] {
  const target = clips.find((c) => c.id === clipId);
  if (!target) return clips;
  return clips
    .filter((c) => c.id !== clipId)
    .map((c) => {
      if (c.trackId === target.trackId && c.startTime > target.startTime) {
        return { ...c, startTime: c.startTime - target.duration };
      }
      return c;
    });
}

/** Trim a clip's in/out — clamps to track bounds. */
export function trimClip(clip: Clip, newStart: number, newDuration: number, minDuration = 0.1): Clip {
  const start = Math.max(0, newStart);
  const dur   = Math.max(minDuration, newDuration);
  return { ...clip, startTime: start, duration: dur };
}

/** Calculate total sequence duration from a clip array. */
export function getTotalDuration(clips: Clip[]): number {
  return clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
}

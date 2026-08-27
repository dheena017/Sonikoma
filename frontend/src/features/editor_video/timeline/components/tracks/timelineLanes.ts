// ─── timelineLanes.ts ─────────────────────────────────────────────────────────
// Shared utility for multi-lane no-overlap clip assignment across timeline tracks.

export const STORY_PANEL_LANE_HEIGHT = 56; // px per story panel lane row
export const AUDIO_FX_LANE_HEIGHT = 38;    // px per audio/fx lane row
export const LANE_HEIGHT = AUDIO_FX_LANE_HEIGHT; // default backwards compatibility alias

export interface LaneClip {
  key: string;
  left: number;
  width: number;
}

/**
 * Assigns each clip to the lowest lane index (starting at 0) where it does not overlap
 * any other clip already placed in that lane.
 * If there is open space on Lane 0, it automatically goes there.
 * Returns a map: { [clipKey]: laneIndex }
 */
export function assignLanes(clips: LaneClip[]): Record<string, number> {
  const lanes: Record<string, number> = {};
  // Process clips left-to-right so earlier clips get lower lanes
  const sorted = [...clips].sort((a, b) => a.left - b.left);
  const EPSILON = 1.0; // 1px tolerance so adjacent/touching clips cleanly share the lane

  for (const clip of sorted) {
    let lane = 0;
    while (true) {
      const occupants = sorted.filter(
        (c) => lanes[c.key] !== undefined && lanes[c.key] === lane && c.key !== clip.key
      );
      const hasOverlap = occupants.some(
        (c) => clip.left < c.left + c.width - EPSILON && clip.left + clip.width > c.left + EPSILON
      );
      if (!hasOverlap) {
        lanes[clip.key] = lane;
        break;
      }
      lane++;
    }
  }

  return lanes;
}

/**
 * Calculates dynamic track inner height based on the max lane used and lane row height.
 */
export function trackInnerHeight(
  maxLane: number,
  laneHeight: number = AUDIO_FX_LANE_HEIGHT
): number {
  return (maxLane + 1) * laneHeight;
}


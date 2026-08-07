// ─── useKeyframes ─────────────────────────────────────────────────────────────
// Canonical location: timeline/useKeyframes.ts
// Manages all keyframe state for every clip in the timeline.

import { useState, useCallback } from "react";
import { Keyframe, KeyframeProperty, EasingMode } from "./types";

let _uid = 0;
const uid = () => `kf-${++_uid}-${Date.now()}`;

export interface KeyframesState {
  /** All keyframes keyed by clip key. */
  keyframes: Record<string, Keyframe[]>;
  /** The id of the currently selected keyframe (across all clips). */
  selectedKeyframeId: string | null;
  /** Whether the keyframe sub-rows are globally visible. */
  keyframeRowsVisible: boolean;

  getKeyframesForClip: (clipKey: string) => Keyframe[];
  addKeyframe: (clipKey: string, time: number, property: KeyframeProperty, value: number) => void;
  removeKeyframe: (clipKey: string, keyframeId: string) => void;
  updateKeyframe: (clipKey: string, keyframeId: string, patch: Partial<Omit<Keyframe, "id">>) => void;
  selectKeyframe: (id: string | null) => void;
  toggleKeyframeRows: () => void;
  cycleEasing: (clipKey: string, keyframeId: string) => void;
  clearClipKeyframes: (clipKey: string) => void;
}

const EASING_CYCLE: EasingMode[] = ["linear", "ease-in", "ease-out", "ease-in-out", "step"];

export function useKeyframes(): KeyframesState {
  const [keyframes, setKeyframes] = useState<Record<string, Keyframe[]>>({});
  const [selectedKeyframeId, selectKeyframe] = useState<string | null>(null);
  const [keyframeRowsVisible, setKeyframeRowsVisible] = useState(false);

  const getKeyframesForClip = useCallback(
    (clipKey: string) => keyframes[clipKey] ?? [],
    [keyframes]
  );

  const addKeyframe = useCallback(
    (clipKey: string, time: number, property: KeyframeProperty, value: number) => {
      const kf: Keyframe = { id: uid(), time, property, value, easing: "linear" };
      setKeyframes((prev) => ({
        ...prev,
        [clipKey]: [...(prev[clipKey] ?? []), kf].sort((a, b) => a.time - b.time),
      }));
      selectKeyframe(kf.id);
    },
    []
  );

  const removeKeyframe = useCallback((clipKey: string, keyframeId: string) => {
    setKeyframes((prev) => ({
      ...prev,
      [clipKey]: (prev[clipKey] ?? []).filter((k) => k.id !== keyframeId),
    }));
    selectKeyframe((prev) => (prev === keyframeId ? null : prev));
  }, []);

  const updateKeyframe = useCallback(
    (clipKey: string, keyframeId: string, patch: Partial<Omit<Keyframe, "id">>) => {
      setKeyframes((prev) => ({
        ...prev,
        [clipKey]: (prev[clipKey] ?? []).map((k) =>
          k.id === keyframeId ? { ...k, ...patch } : k
        ),
      }));
    },
    []
  );

  const cycleEasing = useCallback((clipKey: string, keyframeId: string) => {
    setKeyframes((prev) => ({
      ...prev,
      [clipKey]: (prev[clipKey] ?? []).map((k) => {
        if (k.id !== keyframeId) return k;
        const idx = EASING_CYCLE.indexOf(k.easing);
        return { ...k, easing: EASING_CYCLE[(idx + 1) % EASING_CYCLE.length] };
      }),
    }));
  }, []);

  const clearClipKeyframes = useCallback((clipKey: string) => {
    setKeyframes((prev) => ({ ...prev, [clipKey]: [] }));
  }, []);

  const toggleKeyframeRows = useCallback(() => setKeyframeRowsVisible((v) => !v), []);

  return {
    keyframes, selectedKeyframeId, keyframeRowsVisible,
    getKeyframesForClip, addKeyframe, removeKeyframe,
    updateKeyframe, selectKeyframe, toggleKeyframeRows,
    cycleEasing, clearClipKeyframes,
  };
}

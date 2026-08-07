// ─── KeyframeTrack ───────────────────────────────────────────────────────────
// Canonical location: timeline/components/keyframes/KeyframeTrack.tsx

import React from "react";
import { Keyframe } from "../../types";
import KeyframeDiamond from "./KeyframeDiamond";

interface KeyframeTrackProps {
  clipKey: string;
  clipDuration: number;
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  onSelectKeyframe: (id: string) => void;
  onCycleEasing: (keyframeId: string) => void;
  onAddKeyframe: (time: number) => void;
}

const KeyframeTrack: React.FC<KeyframeTrackProps> = ({
  clipKey, clipDuration, keyframes, selectedKeyframeId,
  onSelectKeyframe, onCycleEasing, onAddKeyframe,
}) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;
      const time = parseFloat((pct * clipDuration).toFixed(1));
      onAddKeyframe(time);
    }}
    className="h-3 relative bg-black/40 border-t border-b border-white/[0.04] cursor-crosshair hover:bg-black/60 transition-colors"
    title="Click to add keyframe"
  >
    {/* Baseline connection line */}
    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 pointer-events-none" />

    {keyframes.map((kf) => (
      <KeyframeDiamond
        key={kf.id}
        keyframe={kf}
        clipDuration={clipDuration}
        selected={selectedKeyframeId === kf.id}
        onSelect={(id) => onSelectKeyframe(id)}
        onCycleEasing={(id) => onCycleEasing(id)}
      />
    ))}
  </div>
);

export default React.memo(KeyframeTrack);

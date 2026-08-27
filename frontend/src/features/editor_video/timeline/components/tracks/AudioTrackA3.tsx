// ─── AudioTrackA3 (Voiceover) ─────────────────────────────────────────────────
// Canonical location: timeline/components/tracks/AudioTrackA3.tsx

import React from "react";
import TrackLabel from "../TrackLabel";
import { Mic, Volume2 } from "lucide-react";

interface AudioTrackA3Props {
  panels: any[];
  totalPanels: number;
  voiceActor?: string;
  selectedClip: string | null;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
}

function clipClass(key: string, selectedClip: string | null, base: string) {
  return `absolute flex items-center gap-1 cursor-pointer truncate transition-all rounded-lg border text-[9px] font-mono font-bold px-2 ${base} ${
    selectedClip === key
      ? "ring-2 ring-blue-400/60 brightness-115 z-10"
      : "hover:brightness-110"
  }`;
}

const AudioTrackA3: React.FC<AudioTrackA3Props> = ({
  panels = [],
  totalPanels,
  voiceActor,
  selectedClip,
  muted,
  locked,
  hidden,
  onToggleMute,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
}) => {
  const hasAnyVoice = panels.some(
    (p: any) =>
      p.speech_audio_url ||
      p.narrative_audio_url ||
      p.audio_url ||
      p.speech_text ||
      p.narrative ||
      p.dialogue
  );

  return (
    <div
      className={`h-10 border-b border-white/[0.04] flex items-center ${
        muted ? "opacity-40" : ""
      }`}
    >
      <TrackLabel
        id="A3"
        label="Voiceover"
        color="text-blue-400"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
      />
      <div className="flex-1 relative h-8 mx-1">
        {!hasAnyVoice ? (
          <div className="h-full flex items-center text-[9px] font-mono text-neutral-600 italic px-2">
            No voiceover tracks generated
          </div>
        ) : (
          panels.map((panel: any, idx: number) => {
            const hasVoiceAudio = !!(
              panel.speech_audio_url ||
              panel.narrative_audio_url ||
              panel.audio_url
            );
            const dialogue =
              panel.speech_text ||
              panel.narrative ||
              panel.dialogue ||
              "";

            if (!hasVoiceAudio && !dialogue) return null;

            const speaker = panel.speaker_name || panel.character_name || (voiceActor ? voiceActor.split("—")[0].trim() : "VO");
            const label = dialogue ? `"${dialogue}"` : `${speaker} P#${idx + 1}`;
            const key = `a3-${idx}`;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={clipClass(
                  key,
                  selectedClip,
                  hasVoiceAudio
                    ? "bg-blue-950/90 border-blue-500/50 text-blue-200 h-full"
                    : "bg-blue-950/40 border-blue-500/20 text-blue-300/70 h-full border-dashed"
                )}
                style={{
                  left: `${(idx / Math.max(totalPanels, 1)) * 96}%`,
                  width: `${(1 / Math.max(totalPanels, 1)) * 94}%`,
                }}
                title={`Panel #${idx + 1} Voice: ${label} ${hasVoiceAudio ? "(Audio Synced)" : "(Text Only)"}`}
              >
                {hasVoiceAudio ? (
                  <Volume2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                ) : (
                  <Mic className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                )}
                <span className="truncate">{label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(AudioTrackA3);

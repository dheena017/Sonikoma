import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { AUDIO_SUB_TABS, MOCK_AUDIO_TRACKS } from "../../data/audioData";
import { useAudioPreview } from "../../hooks/useAudioPreview";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { Play, Pause, Mic, Square, Music, Wand2 } from "lucide-react";

interface AudioWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AudioWorkspace: React.FC<AudioWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Music");
  const [searchQuery, setSearchQuery] = useState("");
  const { playingTrackId, togglePlayTrack } = useAudioPreview();
  const { isRecording, recordTime, startRecording, stopRecording } = useVoiceRecorder();

  const filteredTracks = MOCK_AUDIO_TRACKS.filter((t) => {
    const tabMatch = activeTab === "All" || t.category.replace("-", " ") === activeTab.toLowerCase();
    const searchMatch = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Audio Studio" />
      <WorkspaceLayout.Tabs tabs={AUDIO_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search music, SFX, voice, ambient..." />
      <WorkspaceLayout.Content>
        {/* Recorder Panel */}
        {activeTab === "Recorder" && (
          <div className="rounded-2xl bg-neutral-900/60 border border-purple-900/30 p-4 space-y-4">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Voiceover Recorder</h4>
            {/* Waveform visualizer */}
            <div className="h-14 rounded-xl bg-black/60 border border-neutral-800 flex items-center justify-center gap-0.5 overflow-hidden px-3">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${isRecording ? "bg-purple-500" : "bg-neutral-700"}`}
                  style={{ height: isRecording ? `${20 + Math.random() * 80}%` : "20%" }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>{isRecording ? `🔴 Recording ${recordTime}` : "Ready to Record"}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={() => { startRecording(); onTriggerFeedback("Recording started!"); }}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic className="h-3.5 w-3.5" /> Start Recording
                </button>
              ) : (
                <button
                  onClick={() => { stopRecording(); onTriggerFeedback("Recording saved to timeline!"); }}
                  className="flex-1 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5" /> Stop & Save
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Voice */}
        {activeTab === "AI Voice" && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Neural Voice Actors</h4>
            {MOCK_AUDIO_TRACKS.filter((t) => t.category === "ai-voice").map((voice) => (
              <div
                key={voice.id}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{voice.title}</p>
                    <p className="text-[9px] text-neutral-400 font-mono">{voice.badge} · {voice.duration}</p>
                  </div>
                </div>
                <button
                  onClick={() => onTriggerFeedback(`Applied ${voice.title} to narration`)}
                  className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[9px] font-mono font-bold"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mixer */}
        {activeTab === "Mixer" && (
          <div className="space-y-4 font-mono text-xs">
            <h4 className="font-bold text-white uppercase">Audio Mixer</h4>
            {["Narration", "BGM", "SFX", "Ambient"].map((track, i) => (
              <div key={track} className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>{track}</span>
                  <span className="text-white font-bold">{[80, 50, 70, 30][i]}%</span>
                </div>
                <input
                  type="range" min={0} max={100} defaultValue={[80, 50, 70, 30][i]}
                  onChange={() => onTriggerFeedback(`${track} volume updated`)}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Music / SFX / Voice / Ambient tracks */}
        {!["Recorder", "AI Voice", "Mixer"].includes(activeTab) && (
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 flex items-center gap-2.5 group cursor-pointer"
              >
                <button
                  onClick={() => togglePlayTrack(track.id, undefined)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all border ${
                    playingTrackId === track.id
                      ? "bg-purple-600 border-purple-400 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 group-hover:text-white"
                  }`}
                >
                  {playingTrackId === track.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{track.title}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-400">
                    <span>{track.duration}</span>
                    {track.mood && <span className="text-purple-400">• {track.mood}</span>}
                    {track.badge && <span className="text-amber-400">• {track.badge}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onTriggerFeedback(`Added "${track.title}" to audio track`)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600 text-white text-[9px] font-mono font-bold transition-colors"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Audio Studio • Royalty-Free Sound Library" />
    </WorkspaceLayout>
  );
};

import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { AUDIO_SUB_TABS, REAL_AUDIO_TRACKS } from "../../data/audioData";
import { useAudioPreview } from "../../hooks/useAudioPreview";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { Mic, Square, Wand2, Play, Pause, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { AudioWorkspaceHeader } from "./components/AudioWorkspaceHeader";
import { AudioAiToolbar } from "./components/AudioAiToolbar";
import { AudioTrackCard } from "./components/AudioTrackCard";
import { editorEventBus } from "../../events/editorEventBus";

interface AudioWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const AudioWorkspace: React.FC<AudioWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { playingTrackId, togglePlayTrack } = useAudioPreview();
  const {
    isRecording,
    recordTime,
    audioUrl,
    recordedAudio,
    permissionError,
    audioLevels,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  const filteredTracks = REAL_AUDIO_TRACKS.filter((t) => {
    const tabMatch =
      activeTab === "All" ||
      t.category.toLowerCase() === activeTab.toLowerCase();
    const searchMatch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.genre && t.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.mood && t.mood.toLowerCase().includes(searchQuery.toLowerCase()));
    return tabMatch && searchMatch;
  });

  const handleAddAudioToTimeline = (track: any) => {
    // If it's a BGM track, update project music theme or musicUrl
    if (track.category === "music" && appLogic?.setMusicTheme) {
      appLogic.setMusicTheme(track.url || track.title);
    }
    
    // Broadcast on EventBus
    editorEventBus.publish("MEDIA_ADDED", {
      assetId: track.id,
      title: track.title,
      type: track.category === "music" ? "bgm" : "sfx",
      url: track.url,
    });

    onTriggerFeedback(`Added "${track.title}" to ${track.category.toUpperCase()} track`);
  };

  const handleAddRecordedVoiceToTimeline = () => {
    if (!recordedAudio) return;
    editorEventBus.publish("MEDIA_ADDED", {
      assetId: recordedAudio.id,
      title: `Voice Recording (${recordedAudio.durationSecs}s)`,
      type: "voiceover",
      url: recordedAudio.url,
    });
    onTriggerFeedback("Voice recording added to A3 Voiceover timeline track!");
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <AudioWorkspaceHeader
        tabs={AUDIO_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contextual AI Action Bar Component */}
      <AudioAiToolbar onTriggerFeedback={onTriggerFeedback} />

      <WorkspaceLayout.Content>
        {/* Real Live Voiceover Microphone Recorder Panel */}
        {activeTab === "Recorder" && (
          <div className="rounded-2xl bg-neutral-900/80 border border-[#2F2F2F] p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-[#3B82F6]" />
                Live Microphone Voiceover
              </h4>
              <span className="text-[10px] font-mono text-[#60A5FA] bg-[#2A2A2A] px-2 py-0.5 rounded-full border border-[#2F2F2F]">
                100% Real Browser Audio
              </span>
            </div>

            {permissionError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2 text-red-300 text-xs font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}

            {/* Live Web Audio Waveform Visualizer */}
            <div className="h-16 rounded-xl bg-black/80 border border-neutral-800/80 flex items-center justify-center gap-1 overflow-hidden px-4">
              {audioLevels.map((lvl, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    isRecording
                      ? "bg-gradient-to-t from-blue-600 via-blue-600 to-emerald-400"
                      : "bg-neutral-800"
                  }`}
                  style={{
                    height: isRecording ? `${lvl}%` : "15%",
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isRecording ? "bg-red-500 animate-ping" : "bg-neutral-600"
                  }`}
                />
                {isRecording ? `Recording... ${recordTime}` : "Ready to record voice dialogue"}
              </span>
            </div>

            {/* Record / Stop Button */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-red-600/30 transition-all active:scale-95"
                >
                  <Mic className="h-4 w-4" /> Start Voice Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 animate-pulse"
                >
                  <Square className="h-4 w-4" /> Stop & Capture Audio
                </button>
              )}
            </div>

            {/* Recorded Audio Playback & Timeline Dispatch */}
            {recordedAudio && (
              <div className="pt-2 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Recording Captured ({recordedAudio.durationSecs}s)
                  </span>
                </div>

                <audio controls src={recordedAudio.url} className="w-full h-8 rounded-lg" />

                <button
                  type="button"
                  onClick={handleAddRecordedVoiceToTimeline}
                  className="w-full py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#3B82F6] text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-black/50 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Voice Recording to A3 Track
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Voice TTS Preview using Browser SpeechSynthesis */}
        {activeTab === "AI Voice" && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase">
              Web Speech AI Voice Actors
            </h4>
            {[
              { id: "voice-1", name: "Hiroshi (Anime Protagonist)", role: "Energetic Male", pitch: 1.2 },
              { id: "voice-2", name: "Aoi (Cool Heroine)", role: "Clear Female", pitch: 1.0 },
              { id: "voice-3", name: "Kurogane (Dark Boss)", role: "Deep Cinematic", pitch: 0.7 },
              { id: "voice-4", name: "Narrator (Storyteller)", role: "Balanced Studio", pitch: 0.9 },
            ].map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-[#3B82F6]/60 flex items-center justify-between shadow-sm transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Wand2 className="h-4 w-4 text-[#3B82F6] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{v.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{v.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if ("speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                        const utt = new SpeechSynthesisUtterance("I will protect this world, no matter what it takes!");
                        utt.pitch = v.pitch;
                        window.speechSynthesis.speak(utt);
                        onTriggerFeedback(`Previewing ${v.name} voice`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#60A5FA] text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="h-2.5 w-2.5" /> Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (appLogic?.setVoiceActor) {
                        appLogic.setVoiceActor(v.name);
                      }
                      onTriggerFeedback(`Set active voice actor to ${v.name}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2A2A2A] hover:bg-[#3B82F6] text-white text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Real Playable Audio Track Cards for Music / SFX / Ambient */}
        {!["Recorder", "AI Voice"].includes(activeTab) && (
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <AudioTrackCard
                key={track.id}
                track={track}
                isPlaying={playingTrackId === track.id}
                onTogglePlay={() => togglePlayTrack(track.id, track.url, track.category)}
                onAddTrack={() => handleAddAudioToTimeline(track)}
              />
            ))}
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Real Audio Engine • Live Streaming & Recording" />
    </WorkspaceLayout>
  );
};

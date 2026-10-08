import React from "react";
import { Mic, Music, Play } from "lucide-react";
import { VoiceOption, BGM_MOODS } from "../types";

export interface AudioMixerViewProps {
  voices: VoiceOption[];
  selectedVoice: string;
  speechRate: number;
  speechPitch: number;
  bgmMood: string;
  bgmVolume: number;
  onVoiceChange: (voice: string) => void;
  onSpeechRateChange: (rate: number) => void;
  onSpeechPitchChange: (pitch: number) => void;
  onBgmMoodChange: (mood: string) => void;
  onBgmVolumeChange: (volume: number) => void;
  onTestVoice: () => void;
}

export const AudioMixerView: React.FC<AudioMixerViewProps> = ({
  voices,
  selectedVoice,
  speechRate,
  speechPitch,
  bgmMood,
  bgmVolume,
  onVoiceChange,
  onSpeechRateChange,
  onSpeechPitchChange,
  onBgmMoodChange,
  onBgmVolumeChange,
  onTestVoice,
}) => {
  return (
    <div className="p-3.5 flex flex-col gap-3.5 overflow-y-auto bg-[#0a0a0a]">
      {/* ── Primary Voice Actor ── */}
      <div className="bg-[#181818] border border-[#2f2f2f] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Mic size={15} className="text-blue-400" />
          <div>
            <h3 className="text-xs font-bold text-[#e5e5e5]">Neural Voice Actor</h3>
            <p className="text-[10px] text-[#9ca3af]">
              Microsoft Azure Neural voice dubbing
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-wider">
            Voice Model
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="bg-[#121212] border border-[#2f2f2f] rounded-lg px-2.5 py-1.5 text-xs text-[#e5e5e5] outline-none cursor-pointer focus:border-blue-500"
          >
            {voices.length > 0 ? (
              voices.map((v) => (
                <option key={v.code || v.name} value={v.code || v.name}>
                  {v.label || v.name || v.code}
                </option>
              ))
            ) : (
              <>
                <option value="en-US-GuyNeural">
                  🇺🇸 Guy (Neural Action Narrator)
                </option>
                <option value="en-US-AriaNeural">
                  🇺🇸 Aria (Neural Female Lead)
                </option>
                <option value="en-US-ChristopherNeural">
                  🇺🇸 Christopher (Deep Anime Voice)
                </option>
                <option value="ja-JP-NanamiNeural">
                  🇯🇵 Nanami (Japanese Shonen Female)
                </option>
                <option value="ja-JP-KeitaNeural">
                  🇯🇵 Keita (Japanese Shonen Male)
                </option>
              </>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#262626]">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-[#9ca3af]">
              <span className="font-bold uppercase">Speech Rate</span>
              <span className="font-mono text-blue-400">{speechRate}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.1}
              value={speechRate}
              onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
              className="accent-blue-500 bg-[#262626] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-[#9ca3af]">
              <span className="font-bold uppercase">Pitch Shift</span>
              <span className="font-mono text-blue-400">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.1}
              value={speechPitch}
              onChange={(e) => onSpeechPitchChange(parseFloat(e.target.value))}
              className="accent-blue-500 bg-[#262626] h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onTestVoice}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#222222] hover:bg-blue-600 hover:text-white border border-[#2f2f2f] text-blue-400 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Play size={11} />
          <span>Test Voice Narration</span>
        </button>
      </div>

      {/* ── Background Music ── */}
      <div className="bg-[#181818] border border-[#2f2f2f] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Music size={15} className="text-emerald-400" />
          <div>
            <h3 className="text-xs font-bold text-[#e5e5e5]">
              Cinematic BGM Soundtrack
            </h3>
            <p className="text-[10px] text-[#9ca3af]">
              Procedural mood scoring synced with scene transitions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BGM_MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => onBgmMoodChange(mood.id)}
              className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer ${
                bgmMood === mood.id
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                  : "bg-[#121212] border-[#2f2f2f] text-[#9ca3af] hover:border-[#3f3f3f] hover:text-[#e5e5e5]"
              }`}
            >
              <span className="font-bold text-[11px]">{mood.label}</span>
              <span className="text-[9px] text-[#9ca3af] line-clamp-1 mt-0.5">
                {mood.desc}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1 pt-1 border-t border-[#262626]">
          <div className="flex justify-between text-[10px] text-[#9ca3af]">
            <span className="font-bold uppercase text-[9px]">
              BGM Master Volume
            </span>
            <span className="font-mono text-emerald-400">{bgmVolume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={bgmVolume}
            onChange={(e) => onBgmVolumeChange(parseInt(e.target.value))}
            className="accent-emerald-400 bg-[#262626] h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

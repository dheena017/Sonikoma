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
    <div className="p-3.5 flex flex-col gap-3.5 overflow-y-auto">
      {/* ── Primary Voice Actor ── */}
      <div className="bg-[#121827] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Mic size={15} className="text-sky-400" />
          <div>
            <h3 className="text-xs font-bold text-white">Neural Voice Actor</h3>
            <p className="text-[10px] text-slate-400">
              Microsoft Azure Neural voice dubbing
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Voice Model
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="bg-[#0c101d] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
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

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#182236]">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-400">
              <span className="font-bold uppercase">Speech Rate</span>
              <span className="font-mono text-sky-400">{speechRate}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.1}
              value={speechRate}
              onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
              className="accent-sky-500 bg-[#1e293b] h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-slate-400">
              <span className="font-bold uppercase">Pitch Shift</span>
              <span className="font-mono text-sky-400">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.1}
              value={speechPitch}
              onChange={(e) => onSpeechPitchChange(parseFloat(e.target.value))}
              className="accent-sky-500 bg-[#1e293b] h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onTestVoice}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#162033] hover:bg-sky-600 hover:text-white border border-[#253652] text-sky-300 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Play size={11} />
          <span>Test Voice Narration</span>
        </button>
      </div>

      {/* ── Background Music ── */}
      <div className="bg-[#121827] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Music size={15} className="text-emerald-400" />
          <div>
            <h3 className="text-xs font-bold text-white">
              Cinematic BGM Soundtrack
            </h3>
            <p className="text-[10px] text-slate-400">
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
                  ? "bg-sky-950/60 border-sky-500 text-white shadow-sm"
                  : "bg-[#0c101d] border-[#1e293b] text-slate-300 hover:border-slate-600"
              }`}
            >
              <span className="font-bold text-[11px]">{mood.label}</span>
              <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                {mood.desc}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1 pt-1 border-t border-[#182236]">
          <div className="flex justify-between text-[10px] text-slate-400">
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
            className="accent-emerald-400 bg-[#1e293b] h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

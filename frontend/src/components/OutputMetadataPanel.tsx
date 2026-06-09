import React from "react";
import { Download } from "lucide-react";

interface OutputMetadataPanelProps {
  musicTheme: string;
  voiceActor: string;
  videoUrl: string | null;
}

export default function OutputMetadataPanel({
  musicTheme,
  voiceActor,
  videoUrl,
}: OutputMetadataPanelProps) {
  return (
    <div id="video_metadata_panel" className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-5 space-y-3.5">
      <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest font-mono">Output Specifications</h4>
      
      <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-neutral-300">
        <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
          <span className="text-neutral-500 font-sans">Codec</span>
          <span className="font-mono font-semibold">H.264 (MP4 Wrapper)</span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
          <span className="text-neutral-500 font-sans">Soundtrack</span>
          <span className="font-sans font-semibold text-purple-400 truncate max-w-[124px] block" title={musicTheme}>
            {musicTheme}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2 col-span-2">
          <span className="text-neutral-500 font-sans">Active Speaker</span>
          <span className="font-sans font-semibold text-purple-400">{voiceActor}</span>
        </div>
        {videoUrl && (
          <div className="flex items-center justify-between col-span-2 text-emerald-400 font-mono text-[11px] bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1.5 rounded-lg">
            <span>Compiled Output URL:</span>
            <span className="underline select-all truncate max-w-[200px] font-bold">{videoUrl}</span>
          </div>
        )}
      </div>

      {/* Download MP4 Button */}
      {videoUrl && (
        <div className="pt-2">
          <a
            href={videoUrl}
            download={`webtoon_cinemamaster_${Math.random().toString(36).substring(2, 6)}.mp4`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none shadow-lg shadow-purple-900/30 font-sans"
          >
            <Download className="h-4 w-4" />
            <span>Download Master MP4 File</span>
          </a>
        </div>
      )}
    </div>
  );
}

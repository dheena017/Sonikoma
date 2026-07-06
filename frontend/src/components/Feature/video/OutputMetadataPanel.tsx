import React, { useState } from "react";
import { Download, Youtube, Loader2, ExternalLink } from "lucide-react";
import * as api from "../../../api/index.js";
import { fetchWithAuth } from "../../../utils.js";

interface OutputMetadataPanelProps {
  musicTheme: string;
  voiceActor: string;
  videoUrl: string | null;
}

const OutputMetadataPanel = React.memo(
  ({
    musicTheme,
    voiceActor,
    videoUrl,
  }: OutputMetadataPanelProps) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
    const [publishMessage, setPublishMessage] = useState<string | null>(null);

    const handlePublishYouTube = async () => {
      if (!videoUrl) return;
      setIsPublishing(true);
      setPublishMessage(null);
      try {
        const data = await api.exportToYoutube(fetchWithAuth, {
          video_url: videoUrl,
          title: `Webtoon Comic Video - ${musicTheme}`,
          synopsis: `Cinematic Webtoon Video featuring ${voiceActor} and ${musicTheme}.`,
        });
        if (data.success) {
          setYoutubeUrl(data.youtube_url);
          setPublishMessage(data.message);
        } else {
          setPublishMessage(`Error: ${data.detail || "Failed to publish."}`);
        }
      } catch (err: any) {
        setPublishMessage(`Network Error: ${err.message}`);
      } finally {
        setIsPublishing(false);
      }
    };

    return (
      <div
        id="video_metadata_panel"
        className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-5 space-y-3.5"
      >
        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest font-mono">
          Output Specifications
        </h4>

        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-neutral-300">
          <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
            <span className="text-neutral-500 font-sans">Codec</span>
            <span className="font-mono font-semibold">H.264 (MP4 Wrapper)</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
            <span className="text-neutral-500 font-sans">Soundtrack</span>
            <span
              className="font-sans font-semibold text-purple-400 truncate max-w-[124px] block"
              title={musicTheme}
            >
              {musicTheme}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2 col-span-2">
            <span className="text-neutral-500 font-sans">Active Speaker</span>
            <span className="font-sans font-semibold text-purple-400">
              {voiceActor}
            </span>
          </div>
          {videoUrl && (
            <div className="flex items-center justify-between col-span-2 text-emerald-400 font-mono text-[11px] bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1.5 rounded-lg">
              <span>Compiled Output URL:</span>
              <span className="underline select-all truncate max-w-[200px] font-bold">
                {videoUrl}
              </span>
            </div>
          )}
        </div>

        {/* Download MP4 Button */}
        {videoUrl && (
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={videoUrl}
              download={`webtoon_cinemamaster_${Math.random()
                .toString(36)
                .substring(2, 6)}.mp4`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-neutral-700 font-sans"
            >
              <Download className="h-4 w-4" />
              <span>Download Master MP4 File</span>
            </a>

            {/* YouTube Publish Section */}
            <div className="pt-2 border-t border-neutral-800/50 mt-2">
              {!youtubeUrl ? (
                <button
                  onClick={handlePublishYouTube}
                  disabled={isPublishing}
                  className={`w-full text-white font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all select-none border font-sans ${
                    isPublishing
                      ? "bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-70"
                      : "bg-[#FF0000] hover:bg-[#CC0000] border-[#FF0000]/50 shadow-lg shadow-red-900/20 cursor-pointer active:scale-95"
                  }`}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Publishing to YouTube...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="h-4 w-4" />
                      <span>🚀 Publish to YouTube</span>
                    </>
                  )}
                </button>
              ) : (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none border border-green-500/50 shadow-lg shadow-green-900/20 font-sans active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on YouTube</span>
                </a>
              )}
              {publishMessage && (
                <div className="mt-2 text-[10px] text-center font-mono text-neutral-400">
                  {publishMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default OutputMetadataPanel;

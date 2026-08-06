import React, { useState, useEffect } from "react";

interface VideoPreviewCanvasProps {
  panels?: any[];
  videoUrl?: string | null;
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  storyboardPlaying?: boolean;
  toggleStoryboardPlayback?: () => void;
  aspectRatio?: string;
  setAspectRatio?: (ratio: string) => void;
}

const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  panels = [],
  videoUrl = null,
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  storyboardPlaying = false,
  toggleStoryboardPlayback,
  aspectRatio = "16:9",
  setAspectRatio,
}) => {
  const [imageError, setImageError] = useState(false);

  const currentPanel = panels[currentPanelIndex];
  const activeImage =
    currentPanel?.img_url ||
    currentPanel?.image_url ||
    currentPanel?.panel_url ||
    currentPanel?.src ||
    currentPanel?.layers?.background_url ||
    null;

  // Reset image error state when active panel index or activeImage changes
  useEffect(() => {
    setImageError(false);
  }, [currentPanelIndex, activeImage]);

  return (
    <div className="flex-1 bg-[#09090e] border-r border-neutral-800/80 flex flex-col h-full min-w-0 select-none overflow-hidden">
      <div className="flex-1 relative bg-black flex items-center justify-center p-4 min-h-0 overflow-hidden">
        <div
          className={`relative max-h-full max-w-full rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.9)] border border-neutral-800/80 flex items-center justify-center bg-[#060608] ${
            aspectRatio === "9:16"
              ? "aspect-[9/16] h-full"
              : aspectRatio === "1:1"
              ? "aspect-square h-full"
              : "aspect-video w-full"
          }`}
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              controls={false}
              autoPlay
              loop
            />
          ) : activeImage && !imageError ? (
            <img
              src={activeImage}
              alt="Video Preview"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full bg-[#060608]">
              <h3 className="text-base font-black font-sans text-neutral-100 tracking-tight mb-1">
                Adaptation Cinema Studio
              </h3>
              <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed font-mono">
                No direct MP4 compilation or panel image found. Seamlessly playing back interactive storyboard timeline cuts and speech assets live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoPreviewCanvas);

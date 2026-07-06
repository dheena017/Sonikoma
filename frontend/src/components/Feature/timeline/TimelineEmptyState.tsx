import React from "react";

interface TimelineEmptyStateProps {
  hasScrapedImages: boolean;
}

export default function TimelineEmptyState({
  hasScrapedImages,
}: TimelineEmptyStateProps) {
  if (hasScrapedImages) {
    return (
      <div
        id="panels_timeline_section_empty"
        className="bg-neutral-900/30 rounded-2xl border border-purple-500/20 border-dashed p-10 text-center space-y-4 max-w-4xl mx-auto"
      >
        <div className="icon-pill icon-pill--purple mx-auto animate-pulse h-12 w-12 text-xl font-mono">
          ✦
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-neutral-200 font-sans">
            No Scenes in Timeline Yet
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            Images are loaded in the deck below! Select frame items and click{" "}
            <span className="text-purple-300 font-semibold font-mono">
              Insert Selected
            </span>
            , or click{" "}
            <span className="text-purple-300 font-semibold font-mono font-sans">
              + Add to Timeline
            </span>{" "}
            on any individual panel card in the deck to build your video
            timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="panels_timeline_section_empty"
      className="bg-neutral-900/30 rounded-2xl border border-neutral-800/60 border-dashed p-8 text-center space-y-4"
    >
      <div className="icon-pill mx-auto h-12 w-12 text-lg font-mono">
        #
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-neutral-300 font-sans">
          Timeline Deck Awaiting Link
        </p>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
          Once a valid Webtoon viewer URL is pasted, the continuous canvas strip
          will automatically import images. You can then insert, order, and edit
          them into editable scenes here.
        </p>
      </div>
    </div>
  );
}

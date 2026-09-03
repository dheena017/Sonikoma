import React from "react";

export interface VideoPreviewQuickActionOverlayProps {
  onAnimate?: () => void;
  onToggleSubtitles?: () => void;
  showSubtitles?: boolean;
  className?: string;
}

const VideoPreviewQuickActionOverlay: React.FC<
  VideoPreviewQuickActionOverlayProps
> = () => {
  return null;
};

export default React.memo(VideoPreviewQuickActionOverlay);
export { VideoPreviewQuickActionOverlay };

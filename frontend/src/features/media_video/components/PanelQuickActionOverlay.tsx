import React from "react";

interface PanelQuickActionOverlayProps {
  onAnimate?: () => void;
  onToggleSubtitles?: () => void;
  showSubtitles?: boolean;
  className?: string;
}

const PanelQuickActionOverlay: React.FC<PanelQuickActionOverlayProps> = () => {
  return null;
};

export default React.memo(PanelQuickActionOverlay);


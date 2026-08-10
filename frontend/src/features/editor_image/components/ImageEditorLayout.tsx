import React from "react";
import { ImageEditorMiniSidebar } from "@/features/editor_image/components/ImageEditorMiniSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  onOpenToolsPanel?: () => void;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  header,
  onOpenToolsPanel
}) => {
  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#0d0e15] flex flex-col relative">
      {/* Top Header */}
      {header}

      <div className="flex-grow flex flex-row overflow-hidden w-full min-h-0">
        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-neutral-950/90 backdrop-blur-2xl border-r border-neutral-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.4)] flex-shrink-0 z-10">
          <ImageEditorMiniSidebar onOpenToolsPanel={onOpenToolsPanel} />
        </aside>

        {/* Center Canvas & Right properties sidebar (handled by children) */}
        <main className="flex-grow flex flex-row overflow-hidden relative min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};
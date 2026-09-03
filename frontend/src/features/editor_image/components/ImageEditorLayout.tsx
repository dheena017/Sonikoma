import React from "react";
import { ImageEditorMiniSidebar } from "@/features/editor_image/components/ImageEditorMiniSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  onOpenToolsPanel?: () => void;
  onToggleSidebar?: () => void;
  navigateTo?: (path: string) => void;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  scrapedCount?: number;
  panelsCount?: number;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  header,
  onOpenToolsPanel,
  onToggleSidebar,
  navigateTo,
  projectId,
  seriesSlug,
  chapterSlug,
  scrapedCount,
  panelsCount,
}) => {
  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#0A0A0A] text-[#E5E5E5] flex flex-col relative">
      {/* Top Header */}
      {header}

      <div className="flex-grow flex flex-row overflow-hidden w-full min-h-0 relative z-10">
        {/* Left Column: Mini Sidebar */}
        <aside className="hidden lg:block w-20 h-full bg-[#121212] border-r border-[#2F2F2F] shadow-lg flex-shrink-0 z-10">
          <ImageEditorMiniSidebar
            onOpenToolsPanel={onOpenToolsPanel}
            onToggleSidebar={onToggleSidebar}
            navigateTo={navigateTo}
            projectId={projectId}
            seriesSlug={seriesSlug}
            chapterSlug={chapterSlug}
            scrapedCount={scrapedCount}
            panelsCount={panelsCount}
          />
        </aside>

        {/* Center Canvas & Right properties sidebar (handled by children) */}
        <main className="flex-grow flex flex-row overflow-hidden relative min-h-0 bg-[#0A0A0A]">
          {children}
        </main>
      </div>
    </div>
  );
};

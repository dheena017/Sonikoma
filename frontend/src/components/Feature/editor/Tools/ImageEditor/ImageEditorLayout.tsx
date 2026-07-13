import React from "react";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  header
}) => {
  return (
    <div className="w-full h-screen max-h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">
      {/* Top Header */}
      {header}

      <div className="flex-grow flex flex-row overflow-hidden w-full min-h-0">
        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.3)] flex-shrink-0 z-10">
          <ImageEditorMiniSidebar />
        </aside>

        {/* Center Canvas & Right properties sidebar (handled by children) */}
        <main className="flex-grow flex flex-row overflow-hidden relative min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};
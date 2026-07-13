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
    <div className="w-full min-h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden relative">
      {/* Top Header */}
      {header}

      <div className="flex-grow flex flex-row overflow-hidden w-full">
        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-[#121826] border-r border-gray-800 flex-shrink-0 z-10">
          <ImageEditorMiniSidebar />
        </aside>

        {/* Center Canvas & Right properties sidebar (handled by children) */}
        <main className="flex-grow flex flex-row overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
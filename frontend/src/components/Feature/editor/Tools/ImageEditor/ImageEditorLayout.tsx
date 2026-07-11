import React from "react";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import { ImageEditorRightSidebar } from "./ImageEditorRightSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  onClose: () => void;
  onApply: () => void;
  header: React.ReactNode;
  sidebar: React.ReactNode;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  onClose,
  onApply,
  header,
  sidebar
}) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0B0F19] text-white flex flex-col overflow-hidden z-[100]">
      {header}
      <div className="flex-1 flex flex-row overflow-hidden w-full">

        {/* Left Column: Mini Sidebar */}
        <ImageEditorMiniSidebar />

        {/* Center Column: The Interactive Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
               style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }} />

          <div className="relative w-full h-full z-10 flex items-center justify-center p-4">
            {children}
          </div>
        </main>

        {/* Right Column: Properties Panel */}
        {sidebar}

      </div>
    </div>
  );
};
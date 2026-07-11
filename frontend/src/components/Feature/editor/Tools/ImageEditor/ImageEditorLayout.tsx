import React from "react";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import { ImageEditorRightSidebar } from "./ImageEditorRightSidebar";
import MainMiniSidebar from "@/components/MainMiniSidebar";

interface ImageEditorLayoutProps {
  children: React.ReactNode;
  onClose: () => void;
  onApply: () => void;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  onClose,
  onApply
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-white !p-0 !m-0 z-[100] fixed inset-0 rounded-none border-none">
      {/* Global Far-Left Sidebar */}
      <MainMiniSidebar
        currentPath={typeof location !== "undefined" ? location.pathname : ""}
        navigateTo={(path) => {
          // If this layout is used under a router-aware parent, navigate() should be injected there.
          // Fallback: just change window location.
          window.location.assign(path);
        }}
        notificationsCount={0}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative lg:ml-20 rounded-none border-none">
        {/* This layout is a visual wrapper; editor-specific header props are handled by ImageEditorPage */}
        <div className="flex-1 flex flex-row overflow-hidden w-full rounded-none border-none">
          {/* Left Column: Image Editor Mini Sidebar */}
          <ImageEditorMiniSidebar />

          {/* Center Column: The Interactive Canvas */}
          <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center rounded-none border-none">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }}
            />

            <div className="relative w-full h-full z-10 flex items-center justify-center p-8">{children}</div>
          </main>

          {/* Right Column: Properties Panel */}
          <aside className="w-80 lg:w-96 h-full bg-[#121826] border-l border-gray-800 overflow-y-auto flex-shrink-0 z-10 custom-scrollbar">
            <ImageEditorRightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
};

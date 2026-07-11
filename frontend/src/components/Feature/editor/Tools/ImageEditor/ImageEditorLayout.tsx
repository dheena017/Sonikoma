import React, { useState } from "react";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import { ImageEditorRightSidebar } from "./ImageEditorRightSidebar";
import type { ImageTool } from "@/hooks/useImageEditorState";

interface ImageEditorLayoutProps {
  children: React.ReactNode;

  // Header props
  editingImageIdx: number | null;
  scrapedImages: string[];
  handlePrevImage: () => void;
  handleNextImage: () => void;
  handleUndo: () => void;
  historyLength: number;
  handleRedo: () => void;
  redoHistoryLength: number;
  handleDeleteCurrentImage: () => void;
  setEditingImageIdx: (idx: number | null) => void;
  activeTab: ImageTool | string;
  isPipMode: boolean;
  setIsPipMode?: (val: boolean) => void;
  slices: any[];
  isToolsPanelOpen: boolean;
  setIsToolsPanelOpen: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Footer actions (also handled inside ImageEditorHeader)
  onClose: () => void;
  onApply: () => void;
}

export const ImageEditorLayout: React.FC<ImageEditorLayoutProps> = ({
  children,
  editingImageIdx,
  scrapedImages,
  handlePrevImage,
  handleNextImage,
  handleUndo,
  historyLength,
  handleRedo,
  redoHistoryLength,
  handleDeleteCurrentImage,
  setEditingImageIdx,
  activeTab,
  isPipMode,
  setIsPipMode,
  slices,
  isToolsPanelOpen,
  setIsToolsPanelOpen,
  onClose,
  onApply
}) => {
  // Local UI state for the left sidebar menu
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    // 1. ROOT WRAPPER: Fixed to viewport, nuking inherited margins (!p-0 !m-0), hidden overflow
    <div className="fixed inset-0 w-screen h-screen !p-0 !m-0 bg-[#0B0F19] text-white flex flex-col overflow-hidden z-[100]">
      
      {/* 2. HEADER WRAPPER: flex-shrink-0 guarantees the canvas NEVER squishes the header */}
      <header className="w-full flex-shrink-0 z-50">
        <ImageEditorHeader
          editingImageIdx={editingImageIdx}
          scrapedImages={scrapedImages}
          handlePrevImage={handlePrevImage}
          handleNextImage={handleNextImage}
          handleUndo={handleUndo}
          historyLength={historyLength}
          handleRedo={handleRedo}
          redoHistoryLength={redoHistoryLength}
          handleDeleteCurrentImage={handleDeleteCurrentImage}
          setEditingImageIdx={setEditingImageIdx}
          activeTab={activeTab}
          isPipMode={isPipMode}
          setIsPipMode={setIsPipMode}
          slices={slices}
          isToolsPanelOpen={isToolsPanelOpen}
          setIsToolsPanelOpen={setIsToolsPanelOpen}
          // Pass down the left sidebar state to the hamburger menu in the header
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onClose={onClose}
          onApply={onApply}
        />
      </header>

      {/* 3. MAIN WORKSPACE ROW */}
      <div className="flex-1 flex flex-row overflow-hidden w-full relative">
        
        {/* Left Column: Mini Sidebar (Pass the isOpen state to animate it) */}
        <ImageEditorMiniSidebar isOpen={isLeftSidebarOpen} />

        {/* Center Column: The Interactive Canvas */}
        {/* flex-1 takes all remaining space, overflow-hidden stops page scrolling */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#05050A] flex items-center justify-center">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#374151 1px, transparent 0)",
              backgroundSize: "20px 20px"
            }}
          />
          {/* Canvas Mount Point */}
          <div className="relative w-full h-full z-10">
            {children}
          </div>
        </main>

        {/* Right Column: Properties Panel (Animated width based on isToolsPanelOpen) */}
        <aside 
          className={`h-full bg-[#121826] border-l border-neutral-800/60 overflow-hidden flex-shrink-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isToolsPanelOpen ? "w-[320px] lg:w-[384px] opacity-100" : "w-0 opacity-0 border-none"
          }`}
        >
          {/* Fixed inner width prevents content from squishing while animating closed */}
          <div className="w-[320px] lg:w-[384px] h-full overflow-y-auto custom-scrollbar">
            <ImageEditorRightSidebar />
          </div>
        </aside>
      </div>
      
    </div>
  );
};

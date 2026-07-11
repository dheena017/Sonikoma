import React from "react";
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
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0B0F19] text-white flex flex-col overflow-hidden z-[100]">
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
      />

      <div className="flex-1 flex flex-row overflow-hidden w-full">
        {/* Left Column: Mini Sidebar */}
        <ImageEditorMiniSidebar />


        {/* Center Column: The Interactive Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#374151 1px, transparent 0)",
              backgroundSize: "20px 20px"
            }}
          />

          <div className="relative w-full h-full z-10">{children}</div>
        </main>

        {/* Right Column: Properties Panel */}
        <aside className="w-80 lg:w-96 h-full bg-[#121826] border-l border-gray-800 overflow-y-auto flex-shrink-0 z-10 custom-scrollbar">
          <ImageEditorRightSidebar />
        </aside>
      </div>
    </div>
  );
};


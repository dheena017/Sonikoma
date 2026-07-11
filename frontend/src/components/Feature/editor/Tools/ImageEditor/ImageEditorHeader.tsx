import React from "react";
import {
  X,
  Check,
  Undo,
  Redo,
  ChevronLeft,
  ChevronRight,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  Minimize2
} from "lucide-react";
import { ImageTool } from "@/hooks/useImageEditorState"; // Adjust path if needed


interface ImageEditorHeaderProps {
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
}

export const ImageEditorHeader: React.FC<ImageEditorHeaderProps> = ({ 
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
  setIsToolsPanelOpen
}) => {
  const hasMultipleImages = scrapedImages.length > 1;

  return (
    <header className="h-16 w-full bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6 flex-shrink-0 z-50 rounded-none !m-0">
      {/* Left: Title, Badge & Navigation */}
      <div className="flex items-center space-x-4">
        <span className="px-3 py-1 text-[10px] font-bold tracking-wider text-purple-400 bg-purple-900/30 rounded-full border border-purple-700/50">
          IMAGE EDITOR
        </span>

        {hasMultipleImages && (
          <div className="flex items-center space-x-1 bg-gray-900/50 rounded-lg p-1 border border-neutral-800">
            <button 
              onClick={handlePrevImage}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
              title="Previous Image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-400 min-w-[3rem] text-center">
              {editingImageIdx !== null ? editingImageIdx + 1 : 0} / {scrapedImages.length}
            </span>
            <button 
              onClick={handleNextImage}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
              title="Next Image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="hidden md:block">
          <h1 className="text-sm font-semibold text-white">Advanced Image & Style Editor</h1>
        </div>
      </div>

      {/* Center: History & Canvas Tools */}
      <div className="flex items-center space-x-2 bg-gray-900/50 p-1 rounded-lg border border-neutral-800">
        <button
          onClick={handleUndo}
          disabled={historyLength === 0}
          className={`p-2 rounded-md transition ${historyLength > 0 ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'}`}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoHistoryLength === 0}
          className={`p-2 rounded-md transition ${redoHistoryLength > 0 ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'}`}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1"></div>
        <button
          onClick={handleDeleteCurrentImage}
          className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-red-900/20 transition"
          title="Delete Image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {setIsPipMode && (
          <button
            onClick={() => setIsPipMode(true)}
            className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
            title="Picture-in-Picture Mode"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: Toggle Sidebar & Exit Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsToolsPanelOpen((prev) => !prev)}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition border border-transparent hover:border-gray-700"
          title={isToolsPanelOpen ? "Close Properties Panel" : "Open Properties Panel"}
        >
          {isToolsPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
        </button>

        <div className="w-px h-6 bg-neutral-800 mx-2"></div>

        <button 
          onClick={() => {
            // Parent is expected to wire exit/cancel behavior.
            // For now, just close the editor by dispatching a global event.
            window.dispatchEvent(new Event("FABRIC_REQUEST_EXIT_IMAGE_EDITOR"));
          }}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent hover:bg-neutral-800 rounded-lg transition flex items-center"
        >
          <X className="w-4 h-4 mr-2" /> Cancel
        </button>

        
        <button 
          onClick={() => {
            // Trigger your global save event here
            window.dispatchEvent(new Event("FABRIC_REQUEST_SAVE"));
            setEditingImageIdx(null);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center shadow-lg shadow-purple-900/20"
        >
          <Check className="w-4 h-4 mr-2" /> Apply Changes
        </button>
      </div>
    </header>
  );
};

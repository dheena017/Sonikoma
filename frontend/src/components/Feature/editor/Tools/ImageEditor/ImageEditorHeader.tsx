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
  Minimize2,
  Search,
  Menu
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
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
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
  setIsToolsPanelOpen,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
}) => {
  const hasMultipleImages = scrapedImages.length > 1;

  return (
    <header className="w-full h-[60px] bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 flex items-center justify-between px-4 z-50">
      
      {/* 1. Left: Branding & Navigation */}
      <div className="flex items-center gap-4">
        {/* Left: hamburger toggle for mini sidebar */}
        <div className="w-auto flex items-center justify-center shrink-0 pr-2 border-r border-neutral-800/60">
          <button
            onClick={onToggleLeftSidebar ?? (() => {})}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
            title="Toggle Tools Menu"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" className="h-8 w-8 rounded-full object-cover" alt="Sonikoma" />
          <div className="hidden lg:block">
            <h1 className="text-[11px] font-black tracking-wider text-white">SONIKOMA</h1>
            <p className="text-[9px] text-purple-400 font-mono">IMAGE EDITOR</p>
          </div>
        </div>

        {hasMultipleImages && (
          <div className="flex items-center space-x-1 bg-gray-900/50 rounded-lg p-1 border border-gray-800">
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

      {/* 3. Right: Status, History, & Actions */}
      <div className="flex items-center gap-3">
        {/* Server Status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-850 text-[10px]">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-emerald-400 font-bold uppercase">Online</span>
        </div>

        {/* History Tools */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-850">
           <button onClick={handleUndo} disabled={historyLength === 0} className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30"><Undo className="w-4 h-4" /></button>
           <button onClick={handleRedo} disabled={redoHistoryLength === 0} className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30"><Redo className="w-4 h-4" /></button>
        </div>

        {/* Panel Toggles */}
        <button onClick={() => setIsToolsPanelOpen((prev) => !prev)} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-850">
          {isToolsPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        <div className="w-px h-6 bg-gray-800 mx-2"></div>

        <button 
          onClick={() => setEditingImageIdx(null)}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent hover:bg-gray-800 rounded-lg transition flex items-center"
        >
          <X className="w-4 h-4 mr-2" /> Cancel
        </button>
        
        <button 
          onClick={() => {
            // Trigger your global save event here
            window.dispatchEvent(new Event("FABRIC_REQUEST_SAVE"));
            setEditingImageIdx(null);
          }}
          className="px-4 py-1.5 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-900/20"
        >
          <Check className="w-4 h-4 mr-2" /> Apply Changes
        </button>
      </div>
    </header>
  );
};

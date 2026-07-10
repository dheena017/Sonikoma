import React from "react";
import { ImageEditorHeader } from "./ImageEditorHeader";
import { ImageEditorMiniSidebar } from "./ImageEditorMiniSidebar";
import { ImageEditorRightSidebar } from "./ImageEditorRightSidebar";

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
    <div className="fixed inset-0 w-screen h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden z-[100]">
      <div className="flex-1 flex flex-row overflow-hidden w-full">
        
        {/* Left Column: Mini Sidebar */}
        <aside className="w-20 h-full bg-[#121826] border-r border-gray-800 flex-shrink-0 z-10">
          <ImageEditorMiniSidebar />
        </aside>

        {/* Center Column: The Interactive Canvas */}
        <main className="flex-1 h-full relative overflow-hidden bg-black/50 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: "radial-gradient(#374151 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          
          <div className="relative w-full h-full z-10">
            {children}
          </div>
        </main>

        {/* Right Column: Properties Panel */}
        <aside className="w-80 lg:w-96 h-full bg-[#121826] border-l border-gray-800 overflow-y-auto flex-shrink-0 z-10 custom-scrollbar">
          <ImageEditorRightSidebar />
        </aside>

      </div>
    </div>
  );
};
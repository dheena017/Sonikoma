import React from "react";
import { useImageEditorStore } from "@/hooks/useImageEditorState";

export const ImageEditorRightSidebar: React.FC = () => {
  const { activeTool } = useImageEditorStore();

  return (
    <div className="w-full h-full p-5 flex flex-col space-y-6">
      
      {activeTool === "edit" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Rotate & Flip</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-gray-800/50 hover:bg-gray-700 p-3 rounded-xl text-sm border border-gray-700/50 transition">Rotate -90°</button>
              <button className="bg-gray-800/50 hover:bg-gray-700 p-3 rounded-xl text-sm border border-gray-700/50 transition">Rotate +90°</button>
              <button className="bg-gray-800/50 hover:bg-gray-700 p-3 rounded-xl text-sm border border-gray-700/50 transition">Flip Horizontal</button>
              <button className="bg-gray-800/50 hover:bg-gray-700 p-3 rounded-xl text-sm border border-gray-700/50 transition">Flip Vertical</button>
            </div>
          </div>
          <hr className="border-gray-800" />
          {/* Add your actual Color Grading sliders here */}
        </div>
      )}

      {activeTool === "eraser" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Eraser Settings</h3>
           {/* Plug in your eraseMethod and sensitivity states here */}
           <div className="h-32 bg-gray-800/30 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-sm">
               AI Bubble Cleaner Controls
            </div>
        </div>
      )}

      {(activeTool as unknown) === "layers" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <h3 className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-4">AI Separation</h3>
           <p className="text-sm text-gray-400 mb-4">Extract characters and speech bubbles into movable layers.</p>
           <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition shadow-lg shadow-purple-900/20">
             Execute Layer Extraction
           </button>
        </div>
      )}

      {/* Placeholder for remaining tools (slice, crop, merge, draw, adjust) */}
      {!["edit", "eraser", "layers"].includes(activeTool as any) && (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
          Select properties for {activeTool}
        </div>
      )}

    </div>
  );
};
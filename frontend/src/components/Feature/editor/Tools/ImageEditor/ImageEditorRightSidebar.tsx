import React from 'react';
import { useImageEditorStore } from '@/hooks/useImageEditorState';

export const ImageEditorRightSidebar: React.FC = () => {
  const { activeTool } = useImageEditorStore();

  return (
    <div className="w-full h-full p-5 flex flex-col space-y-6">
      
      {/* 1. EDIT TOOL PROPERTIES */}
      {activeTool === 'edit' && (
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

          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Color Grading</h3>
            {/* Add your brightness/contrast sliders here */}
            <div className="h-24 bg-gray-800/30 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-sm">
               Sliders Component Here
            </div>
          </div>
        </div>
      )}

      {/* 2. DRAW TOOL PROPERTIES */}
      {activeTool === 'draw' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Brush Settings</h3>
           {/* Add brush color picker and size slider here */}
           <div className="h-32 bg-gray-800/30 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-sm">
               Brush Controls Here
            </div>
        </div>
      )}

      {/* Add more conditional blocks for Erase, Layers, etc. */}
      {activeTool === 'layers' && (
        <div className="space-y-6">
           <h3 className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-4">AI Separation</h3>
           <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition shadow-lg shadow-purple-900/20">
             Extract Characters
           </button>
        </div>
      )}

    </div>
  );
};

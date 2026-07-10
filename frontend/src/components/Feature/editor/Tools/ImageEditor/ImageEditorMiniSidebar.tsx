import React from 'react';
import { useImageEditorStore } from '@/hooks/useImageEditorState'; // Adjust to your actual hook path
import { Sliders, Edit3, Eraser, Scissors, Crop, Layers } from 'lucide-react'; 

export const ImageEditorMiniSidebar: React.FC = () => {
  // Pull your global Zustand state here
  const { activeTool, setActiveTool } = useImageEditorStore();

  const tools = [
    { id: 'edit', label: 'Edit', icon: Sliders },
    { id: 'draw', label: 'Draw', icon: Edit3 },
    { id: 'erase', label: 'Erase', icon: Eraser },
    { id: 'cut', label: 'Cut', icon: Scissors },
    { id: 'crop', label: 'Crop', icon: Crop },
    { id: 'layers', label: 'Separate', icon: Layers }, // Your new AI feature!
  ];

  return (
    <div className="w-full h-full flex flex-col items-center py-6 space-y-4 overflow-y-auto hide-scrollbar">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
            className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
              isActive 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-[9px] font-medium tracking-wide uppercase">
              {tool.label}
            </span>
            
            {/* Active Indicator Dot */}
            {isActive && (
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

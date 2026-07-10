import React from 'react';
import { X, Check, Undo, Redo } from 'lucide-react'; // Adjust icons to your library

interface HeaderProps {
  onClose: () => void;
  onApply: () => void;
}

export const ImageEditorHeader: React.FC<HeaderProps> = ({ onClose, onApply }) => {
  return (
    <header className="h-16 w-full bg-[#0B0F19] border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Title & Badge */}
      <div className="flex items-center space-x-4">
        <span className="px-3 py-1 text-xs font-bold tracking-wider text-purple-400 bg-purple-900/30 rounded-full">
          IMAGE EDITOR
        </span>
        <div>
          <h1 className="text-sm font-semibold text-white">Advanced Image & Style Editor</h1>
          <p className="text-xs text-gray-400">Enhance, draw, crop, and adjust properties.</p>
        </div>
      </div>

      {/* Center: History Tools (Optional) */}
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent hover:bg-gray-800 rounded-lg transition flex items-center"
        >
          <X className="w-4 h-4 mr-2" /> Cancel
        </button>
        <button 
          onClick={onApply}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center shadow-lg shadow-purple-900/20"
        >
          <Check className="w-4 h-4 mr-2" /> Apply Changes
        </button>
      </div>
    </header>
  );
};

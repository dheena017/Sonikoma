import React from 'react';
import { useEditorState } from '../hooks/useEditorState';
import {
  Monitor,
  Scissors,
  Wand2,
  MessageSquareX,
  Music,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const ToolSidebar: React.FC = () => {
  const { activeTool, setActiveTool, isSidebarExpanded, setIsSidebarExpanded } = useEditorState();

  const tools = [
    { id: 'workspace', icon: <Monitor size={20} />, label: 'Workspace' },
    { id: 'autocrop', icon: <Wand2 size={20} />, label: 'Auto Crop' },
    { id: 'bubbleclean', icon: <MessageSquareX size={20} />, label: 'Clean Speech' },
    { id: 'audiolab', icon: <Music size={20} />, label: 'Audio Lab' },
    { id: 'cuts', icon: <Scissors size={20} />, label: 'Cuts & Transitions' },
  ] as const;

  if (!isSidebarExpanded) {
    return (
      <div className="w-16 h-full bg-slate-900 border-l border-slate-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsSidebarExpanded(true)}
          className="p-2 mb-4 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-3 mb-2 rounded-xl transition-colors ${
              activeTool === tool.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Inspector</h2>
        <button
          onClick={() => setIsSidebarExpanded(false)}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex p-2 gap-1 overflow-x-auto border-b border-slate-800/50">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap rounded-lg flex items-center gap-2 transition-colors ${
              activeTool === tool.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tool.icon}
            {tool.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTool === 'workspace' && <div className="text-slate-400">Workspace settings...</div>}
        {activeTool === 'autocrop' && <div className="text-slate-400">Auto Crop controls...</div>}
        {activeTool === 'bubbleclean' && <div className="text-slate-400">Bubble Cleaning controls...</div>}
        {activeTool === 'audiolab' && <div className="text-slate-400">Audio Lab mixer...</div>}
        {activeTool === 'cuts' && <div className="text-slate-400">Video cuts registry...</div>}
      </div>
    </div>
  );
};

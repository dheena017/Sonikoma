import React from "react";

interface ProEditorLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  isFocusMode: boolean;
}

const ProEditorLayout: React.FC<ProEditorLayoutProps> = ({
  leftPanel,
  centerPanel,
  bottomPanel,
  isFocusMode,
}) => {
  return (
    <div className="w-full flex flex-col">
      {/* Top Half: Left (Media Library) and Center (Video Monitor) */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 min-h-[50vh]">

        {/* Left Panel - Imported Images (Media Library) */}
        {/* This panel should NOT be blurred in focus mode, as it contains the editor */}
        <div className={`w-full lg:w-1/3 xl:w-1/4 flex flex-col bg-[#111115] border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500`}>
          <div className="p-4 border-b border-white/5 bg-neutral-900/50">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">1. Imported Images</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {leftPanel}
          </div>
        </div>

        {/* Center Panel - Video Monitor */}
        {/* Apply focus mode blur to this panel */}
        <div className={`w-full lg:w-2/3 xl:w-3/4 flex flex-col bg-[#111115] border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isFocusMode ? 'opacity-20 blur-sm pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
          <div className="p-4 border-b border-white/5 bg-neutral-900/50">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">2. Video Monitor</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden">
             {centerPanel}
          </div>
        </div>

      </div>

      {/* Bottom Half: Storyboard Timeline */}
      {/* Apply focus mode blur to this panel */}
      <div className={`w-full bg-[#111115] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-500 ${isFocusMode ? 'opacity-20 blur-sm pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
        <div className="p-4 border-b border-white/5 bg-neutral-900/50">
           <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">3. Storyboard Timeline & Production</h3>
        </div>
        <div className="p-4 flex-1">
          {bottomPanel}
        </div>
      </div>

    </div>
  );
};

export default React.memo(ProEditorLayout);

import React from "react";

export function BubblesBefore() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      {/* Comic Illustration */}
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-orange-400/80 blur-md" />
        <div className="absolute bottom-0 right-0 w-32 h-44 bg-neutral-800 rounded-t-[50px] border border-white/5" />
        <div className="absolute bottom-36 right-8 w-16 h-16 rounded-full bg-neutral-700" />

        {/* Speech Bubble */}
        <div className="absolute top-8 right-6 bg-white text-black p-4 rounded-[20px] rounded-tr-none shadow-2xl max-w-[150px] border-2 border-black flex flex-col justify-center items-center">
          <span className="text-sm font-bold text-center">Amazing!</span>
          <span className="text-xs text-gray-600">This is awesome</span>
          <div className="absolute -right-2 top-0 w-4 h-4 bg-white border-r-2 border-t-2 border-black rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

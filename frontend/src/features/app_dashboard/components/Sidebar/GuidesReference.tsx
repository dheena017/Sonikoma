import React from "react";
import {
  BookOpen,
  Sliders,
} from "lucide-react";

interface GuidesReferenceProps {
  onNavigate: (path: string) => void;
}

export default function GuidesReference({ onNavigate }: GuidesReferenceProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 shadow-md hover:border-[#2F2F2F]/80 transition-all duration-200 text-left">
      <h3 className="text-sm font-bold text-[#E5E5E5] mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#3B82F6]" />
        Guides & Reference
      </h3>

      <div className="space-y-3">
        <button
          onClick={() => onNavigate("/shortcuts")}
          className="w-full text-left bg-[#121212] hover:bg-[#242424] p-3 rounded-xl border border-[#2F2F2F] transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#E5E5E5]">
                Keyboard Shortcuts
              </h4>
              <p className="text-[10px] text-[#9CA3AF] font-sans mt-0.5">
                Quick actions for editor & studio
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

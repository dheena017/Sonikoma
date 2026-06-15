import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface LoadingPageProps {
  status?: string;
  progress?: number;
}

export default function LoadingPage({ status = "Connecting to Computational Engine...", progress }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-purple-600/30 blur-[60px] rounded-full animate-pulse" />

        {/* Logo Icon */}
        <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-900/40 animate-bounce-slow">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>

      <div className="space-y-6 max-w-xs w-full">
        <div className="space-y-2">
           <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Anivox</h2>
           <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">{status}</p>
        </div>

        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
           <div
             className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
             style={{ width: progress !== undefined ? `${progress}%` : "30%" }}
           />
           {progress === undefined && (
             <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
           )}
        </div>

        <div className="flex items-center justify-center gap-2 text-purple-400/60">
           <Loader2 className="w-3 h-3 animate-spin" />
           <span className="text-[10px] font-bold uppercase tracking-tighter">System Initializing</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0">
         <p className="text-neutral-600 text-[10px] uppercase font-black tracking-[0.2em]">Built for the future of comics</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

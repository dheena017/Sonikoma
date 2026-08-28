import React from "react";
import AuthShowcase from "@/features/app_auth/components/AuthShowcase";
import { ThemeKey, THEMES } from "@/features/app_auth/components/constants";

interface AuthPageShellProps {
  activeTheme: ThemeKey;
  iconType: "login" | "register" | "forgot";
  rightHeader: React.ReactNode;
  rightBody: React.ReactNode;
  rightFooter?: React.ReactNode;
}

export default function AuthPageShell({
  activeTheme,
  iconType,
  rightHeader,
  rightBody,
  rightFooter,
}: AuthPageShellProps) {
  const currentTheme = THEMES[activeTheme];

  return (
    <div className="min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden relative">
      <AuthShowcase activeTheme={activeTheme} iconType={iconType} />

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col bg-neutral-950/60 backdrop-blur-xl relative border-l border-white/10 text-left">
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[55%] rounded-full ${currentTheme.glowPrimary} blur-[120px] pointer-events-none transition-all duration-1000 opacity-60`}
        />
        <div className="absolute bottom-0 right-0 w-[50%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        {/* Subtle top-edge laser accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent pointer-events-none" />

        {/* Pinned header — never scrolls */}
        <div className="relative z-10 px-8 lg:px-16 pt-8 lg:pt-10 flex-shrink-0">
          {rightHeader}
        </div>

        {/* Scrollable body — starts below header */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-8 lg:px-16 pb-8 lg:pb-16">
          <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-6">
            {rightBody}
          </div>

          {rightFooter}

          <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
            © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

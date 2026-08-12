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
    <div className="min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden">
      <AuthShowcase activeTheme={activeTheme} iconType={iconType} />

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col bg-[#040406] relative text-left">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full ${currentTheme.glowPrimary} blur-[120px] pointer-events-none transition-all duration-1000`}
        />

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

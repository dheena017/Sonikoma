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
  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden relative">
      <AuthShowcase activeTheme={activeTheme} iconType={iconType} />

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col bg-[#121212] relative border-l border-[#2F2F2F] text-left">
        {/* Subtle top-edge accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent pointer-events-none" />

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

          <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-[#6B7280] font-semibold">
            © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

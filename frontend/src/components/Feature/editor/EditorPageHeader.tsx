import React from "react";
import { ArrowLeft, Focus, LayoutPanelTop, Save, Menu } from "lucide-react";

interface EditorPageHeaderProps {
  title: string;
  subtitle?: string;
  onBackToApp: () => void;
  onSave: () => void;
  isSaving: boolean;
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isSidebarOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const EditorPageHeader: React.FC<EditorPageHeaderProps> = ({
  title,
  subtitle,
  onBackToApp,
  onSave,
  isSaving,
  isFocusMode,
  setIsFocusMode,
  onToggleSidebar,
  isSidebarCollapsed,
  isSidebarOpen = false,
  className,
  style,
}) => {
  // Smoothly slide out of view if the mobile/drawer sidebar is open
  const headerVisibilityClass = isSidebarOpen
    ? "-translate-y-full opacity-0 pointer-events-none"
    : "translate-y-0 opacity-100";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-purple-900/20 bg-[#0a0a0e]/90 backdrop-blur-md shadow-2xl shadow-black/40 pr-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${headerVisibilityClass} ${
        className || ""
      }`}
      style={style}
    >
      {/* Left Section - Menu Icon + Title */}
      <div className="flex items-center shrink-0">
        {/* PREMIUM ALIGNMENT FIX: w-20 wrapper perfectly aligns the menu button above the mini-sidebar */}
        <div className="w-16 lg:w-20 flex items-center justify-center shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white cursor-pointer transition-colors active:scale-95"
              title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            alt="Sonikoma Logo"
            className="h-9 w-9 rounded-full bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover border border-white/5"
          />
          <div className="min-w-0 hidden sm:block">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-purple-400/80 leading-none">
              Editor Workspace
            </p>
            <div className="mt-1 flex items-center gap-2">
              <LayoutPanelTop className="h-3.5 w-3.5 text-purple-400" />
              <h2 className="truncate text-sm font-bold text-white leading-none tracking-wide">
                {title}
              </h2>
            </div>
            {subtitle ? (
              <p className="mt-1 truncate text-[10px] text-neutral-400 font-mono leading-none">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFocusMode((value) => !value)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isFocusMode
              ? "border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Focus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isFocusMode ? "Exit Focus" : "Focus Mode"}
          </span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-[0_4px_14px_rgba(168,85,247,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
        >
          <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-pulse" : ""}`} />
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <span className="hidden sm:inline">Save Project</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToApp}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-900/60 hover:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-300 transition-all hover:text-white active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
    </header>
  );
};

export default React.memo(EditorPageHeader);

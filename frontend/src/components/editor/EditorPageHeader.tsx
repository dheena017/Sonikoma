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
  const headerSurfaceClass = isSidebarOpen
    ? "hidden"
    : "border-white/10 bg-[#0f1014]/95 shadow-2xl shadow-black/40 backdrop-blur-xl";

  return (
    <header
      className={`z-40 mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${headerSurfaceClass} ${className ?? ""}`}
      style={style}
    >
      {/* Left Section - Menu Icon + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex-shrink-0 p-2 rounded-xl border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10 transition"
            title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-purple-400/80">
            Editor workspace
          </p>
          <div className="mt-1 flex items-center gap-2">
            <LayoutPanelTop className="h-4 w-4 text-purple-400" />
            <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
          </div>
          {subtitle ? (
            <p className="mt-1 truncate text-xs text-neutral-400">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFocusMode((value) => !value)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
        >
          <Focus className="h-3.5 w-3.5" />
          {isFocusMode ? "Exit focus" : "Focus mode"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={onBackToApp}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    </header>
  );
};

export default React.memo(EditorPageHeader);

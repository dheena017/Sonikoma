import React from "react";
import { Keyboard, RefreshCw, Download, Upload, ArrowLeft } from "lucide-react";
import {
  ShortcutSearch,
  ShortcutCategoryTabs,
} from "@/features/app_shortcuts/components/ShortcutFilters";
import ShortcutList from "@/features/app_shortcuts/components/ShortcutList";
import ShortcutRecordingModal from "@/features/app_shortcuts/components/ShortcutRecordingModal";
import { getActionDetails } from "@/features/app_shortcuts/components/shortcutUtils";
import { ShortcutsPageProps } from "@/features/app_shortcuts/components/shortcutTypes";
import { useShortcutsPage } from "@/features/app_shortcuts/hooks/useShortcutsPage";

const ShortcutsPageContent = React.memo(
  ({
    shortcuts,
    setShortcuts,
    defaultShortcuts,
    onNavigateHome,
    addNotification,
    audioFeedback,
  }: ShortcutsPageProps) => {
    const {
      searchQuery,
      setSearchQuery,
      recordingActionId,
      conflictMsg,
      activeCategory,
      fileInputRef,
      filteredShortcuts,
      handleResetToDefaults,
      handleResetSingle,
      handleDisableSingle,
      handleExport,
      handleImport,
      handleClearFilters,
      handleStartRecording,
      setActiveCategory,
      handleCancelRecording,
    } = useShortcutsPage({
      shortcuts,
      setShortcuts,
      defaultShortcuts,
      addNotification,
      audioFeedback,
    });

    return (
      <div className="w-full flex-1 flex flex-col py-4 sm:py-6 max-w-7xl mx-auto text-[#E5E5E5] animate-fade-in text-left">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2F2F2F] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF] mb-1.5">
                <span
                  className="hover:text-[#3B82F6] cursor-pointer"
                  onClick={onNavigateHome}
                >
                  Dashboard
                </span>
                <span>&gt;</span>
                <span className="text-[#3B82F6]">Keys</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#E5E5E5] tracking-tight">
                Keyboard Shortcuts
              </h1>
              <p className="text-sm text-[#737373] mt-1 font-medium">
                Customize your workspace interaction and AI macros.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E1E] border border-[#2F2F2F] text-[#E5E5E5] hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-[#252525] hover:border-[#3B82F6]/60 cursor-pointer shadow-sm"
              >
                <Upload className="h-3.5 w-3.5 text-[#9CA3AF]" />
                Import
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E1E] border border-[#2F2F2F] text-[#E5E5E5] hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-[#252525] hover:border-[#3B82F6]/60 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-[#9CA3AF]" />
                Export
              </button>
              <button
                onClick={handleResetToDefaults}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E1E] border border-[#2F2F2F] text-[#EF4444] hover:text-white hover:bg-[#EF4444] rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Factory Reset
              </button>
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </div>
          </div>

        <div className="flex flex-col md:flex-row gap-6">
          <ShortcutCategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="flex-1 flex flex-col gap-4">
            <ShortcutSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <ShortcutList
              shortcuts={shortcuts}
              filteredShortcuts={filteredShortcuts}
              recordingActionId={recordingActionId}
              searchQuery={searchQuery}
              defaultShortcuts={defaultShortcuts}
              onStartRecording={handleStartRecording}
              onDisableSingle={handleDisableSingle}
              onResetSingle={handleResetSingle}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {recordingActionId && (
          <ShortcutRecordingModal
            recordingActionId={recordingActionId}
            details={getActionDetails(recordingActionId)}
            conflictMsg={conflictMsg}
            onCancel={handleCancelRecording}
          />
        )}
        </div>
      </div>
    );
  }
);

export default ShortcutsPageContent;

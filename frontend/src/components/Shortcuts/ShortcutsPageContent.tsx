import React from "react";
import { Keyboard, RefreshCw, Download, Upload } from "lucide-react";
import { ShortcutSearch, ShortcutCategoryTabs } from "./ShortcutFilters";
import ShortcutList from "./ShortcutList";
import ShortcutRecordingModal from "./ShortcutRecordingModal";
import { getActionDetails } from "./shortcutUtils";
import { ShortcutsPageProps } from "./shortcutTypes";
import { useShortcutsPage } from "./useShortcutsPage";

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
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-2">
              <span
                className="hover:text-purple-400 cursor-pointer transition-colors"
                onClick={onNavigateHome}
              >
                Workspace
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Keyboard Shortcuts</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Keyboard className="h-7 w-7 text-purple-400" />
              </div>
              Shortcuts & Macros
            </h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
              Boost your productivity with custom keybindings. Control the
              editor, navigate the workspace, and trigger AI workflows with your
              keyboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Upload className="h-4 w-4" />
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
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="h-8 w-px bg-neutral-800 mx-1 hidden sm:block" />
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 hover:border-rose-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Factory Reset
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
    );
  }
);

export default ShortcutsPageContent;

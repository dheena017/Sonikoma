import React from "react";
import { Keyboard, RefreshCw, Download, Upload, ArrowLeft } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Keys</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <Keyboard className="h-5 w-5" />
              </div>
              Shortcuts & Macros
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Boost your productivity with custom keybindings. Control the editor, navigate the workspace, and trigger AI workflows
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
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
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-rose-455 hover:text-rose-300 rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Factory Reset
            </button>
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
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
    );
  }
);

export default ShortcutsPageContent;

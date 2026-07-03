import { memo } from "react";
import { TerminalLogsHeader } from "./TerminalLogsHeader.js";
import { TerminalLogsFilter } from "./TerminalLogsFilter.js";
import { TerminalLogsOutput } from "./TerminalLogsOutput.js";
import { LogEntry } from "../../../types/logs";
import { useTerminalLogs } from "./hooks";

interface TerminalLogsProps {
  consoleLogs: LogEntry[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

const TerminalLogs = memo(({
  consoleLogs,
  setConsoleLogs,
}: TerminalLogsProps) => {
  const {
    scrollRef,
    copied,
    autoScroll,
    setAutoScroll,
    paused,
    setPaused,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    displayedLogs,
    errorCount,
    warningCount,
    successCount,
    aiCount,
    handleCopyAll,
    handleCopyVisible,
    handleDownloadLogs,
    handleClear,
  } = useTerminalLogs({ consoleLogs, setConsoleLogs });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5 min-w-0 w-full overflow-hidden">
      <TerminalLogsHeader
        consoleLogs={consoleLogs}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        paused={paused}
        setPaused={setPaused}
        copied={copied}
        handleCopyAll={handleCopyAll}
        handleCopyVisible={handleCopyVisible}
        handleDownloadLogs={handleDownloadLogs}
        handleClear={handleClear}
      />

      <TerminalLogsFilter
        consoleLogs={consoleLogs}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        errorCount={errorCount}
        warningCount={warningCount}
        aiCount={aiCount}
        successCount={successCount}
      />

      <TerminalLogsOutput
        scrollRef={scrollRef}
        filteredLogs={displayedLogs}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
      />
    </div>
  );
});

export default TerminalLogs;


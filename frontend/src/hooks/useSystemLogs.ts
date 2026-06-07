import { useEffect } from "react";

export function useSystemLogs(
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>
) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let isPolling = false;
    const lastLogIdRef = { current: 0 };

    const startPolling = () => {
      if (isPolling) return;
      isPolling = true;

      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/system-logs?since=${lastLogIdRef.current}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.logs)) {
            const newLogs = data.logs.filter((log: any) => log.id > lastLogIdRef.current);
            if (newLogs.length > 0) {
              newLogs.forEach((log: any) => {
                if (log.id > lastLogIdRef.current) {
                  lastLogIdRef.current = log.id;
                }
              });
              setConsoleLogs(prev => [
                ...prev,
                ...newLogs.map((log: any) => log.message)
              ]);
            }
          }
        } catch (err) {
          // Silent catch to prevent console flooding during network restarts
        }
      }, 1500);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      isPolling = false;
    };

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/system-logs/stream');

        eventSource.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            if (entry && entry.id > lastLogIdRef.current) {
              lastLogIdRef.current = entry.id;
              setConsoleLogs(prev => [...prev, entry.message]);
            }
          } catch (e) {
            // silent catch on malformed stream messages
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          startPolling();
        };
      } catch (err) {
        startPolling();
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      stopPolling();
    };
  }, [setConsoleLogs]);
}

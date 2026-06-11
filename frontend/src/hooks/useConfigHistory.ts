import { useState, useCallback, useEffect } from "react";

export function useConfigHistory<T>(key: string, currentState: T) {
  const [history, setHistory] = useState<T[]>(() => {
    try {
      const saved = localStorage.getItem(`${key}_history`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const pushToHistory = useCallback((state: T) => {
    setHistory(prev => {
      // Don't push duplicates
      if (prev.length > 0 && JSON.stringify(prev[0]) === JSON.stringify(state)) return prev;
      const next = [state, ...prev.slice(0, 9)];
      localStorage.setItem(`${key}_history`, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return { history, pushToHistory };
}

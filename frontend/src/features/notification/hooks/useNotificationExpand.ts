import { useState } from "react";

export const useNotificationExpand = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number, callback?: () => void) => {
    setExpandedId((current) => (current === id ? null : id));
    if (callback) {
      callback();
    }
  };

  const isExpanded = (id: number) => expandedId === id;

  const clearExpanded = () => setExpandedId(null);

  return {
    expandedId,
    toggleExpand,
    isExpanded,
    clearExpanded,
  };
};

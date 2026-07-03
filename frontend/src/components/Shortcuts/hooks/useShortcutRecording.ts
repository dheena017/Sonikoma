import { useEffect, useState } from "react";
import { getActionDetails } from "../shortcutUtils";

interface UseShortcutRecordingParams {
  shortcuts: Record<string, string>;
  setShortcuts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addNotification?: (msg: string, type: any) => void;
}

export function useShortcutRecording({
  shortcuts,
  setShortcuts,
  addNotification,
}: UseShortcutRecordingParams) {
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  useEffect(() => {
    (window as any).isRecordingHotkey = recordingActionId !== null;
    return () => {
      (window as any).isRecordingHotkey = false;
    };
  }, [recordingActionId]);

  useEffect(() => {
    if (!recordingActionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        setRecordingActionId(null);
        setConflictMsg(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Control");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let key = e.key;
      if (key === " ") key = "Space";
      if (key.length === 1) {
        key = key.toUpperCase();
      }

      if (["Control", "Alt", "Shift"].includes(e.key)) {
        return;
      }

      parts.push(key);
      const combination = parts.join("+");

      const conflictEntry = Object.entries(shortcuts).find(
        ([id, val]) =>
          id !== recordingActionId &&
          typeof val === "string" &&
          val.toLowerCase() === combination.toLowerCase()
      );

      if (conflictEntry) {
        const details = getActionDetails(conflictEntry[0]);
        setConflictMsg(
          `Conflict: "${combination}" is already assigned to "${details.label}".`
        );
        return;
      }

      setShortcuts((prev) => {
        const next = { ...prev, [recordingActionId!]: combination };
        localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
        return next;
      });

      if (addNotification) {
        const details = getActionDetails(recordingActionId!);
        addNotification(
          `Updated shortcut for ${details.label} to ${combination}`,
          "success"
        );
      }

      setRecordingActionId(null);
      setConflictMsg(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recordingActionId, shortcuts, setShortcuts, addNotification]);

  const handleStartRecording = (id: string) => {
    setRecordingActionId(id);
    setConflictMsg(null);
  };

  const handleCancelRecording = () => {
    setRecordingActionId(null);
    setConflictMsg(null);
  };

  return {
    recordingActionId,
    conflictMsg,
    handleStartRecording,
    handleCancelRecording,
  };
}

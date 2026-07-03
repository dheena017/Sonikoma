import { useRef } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { getActionDetails } from "../shortcutUtils";
import { ShortcutsPageProps } from "../shortcutTypes";

interface UseShortcutPersistenceParams extends Omit<ShortcutsPageProps, "onNavigateHome"> {}

export function useShortcutPersistence({
  shortcuts,
  setShortcuts,
  defaultShortcuts,
  addNotification,
  audioFeedback,
}: UseShortcutPersistenceParams) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetToDefaults = async () => {
    const confirmed = await ((window as any).confirmAsync || window.confirm)(
      "Are you sure you want to restore all keyboard shortcuts to factory defaults?"
    );

    if (!confirmed) return;

    setShortcuts(defaultShortcuts);
    localStorage.setItem("ai_comic_shortcuts", JSON.stringify(defaultShortcuts));

    addNotification?.("Restored default key configurations", "info");
    audioFeedback?.playError();
  };

  const handleResetSingle = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    const defaultValue = defaultShortcuts[id];
    setShortcuts((prev) => {
      const next = { ...prev, [id]: defaultValue };
      localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
      return next;
    });

    addNotification?.(
      `Reset ${getActionDetails(id).label} to default: ${defaultValue}`,
      "info"
    );
  };

  const handleDisableSingle = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    setShortcuts((prev) => {
      const next = { ...prev, [id]: "" };
      localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
      return next;
    });

    addNotification?.(
      `Disabled shortcut for ${getActionDetails(id).label}`,
      "warning"
    );
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(shortcuts, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "sonikoma_shortcuts.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    addNotification?.("Shortcuts exported successfully", "success");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const json = JSON.parse(loadEvent.target?.result as string);
        if (typeof json === "object" && json !== null) {
          const sanitized = Object.fromEntries(
            Object.entries(json).filter(([k, v]) => typeof v === "string")
          ) as Record<string, string>;

          setShortcuts(sanitized);
          localStorage.setItem("ai_comic_shortcuts", JSON.stringify(sanitized));
          addNotification?.("Shortcuts imported successfully", "success");
        }
      } catch {
        addNotification?.("Failed to import shortcuts: Invalid JSON", "error");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  return {
    fileInputRef,
    handleResetToDefaults,
    handleResetSingle,
    handleDisableSingle,
    handleExport,
    handleImport,
  };
}

import React, { useState, useMemo, useCallback } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { Film, Plus } from "lucide-react";
import {
  StoryboardWorkspaceHeader,
  StoryboardFilterTab,
} from "./components/StoryboardWorkspaceHeader";
import { StoryboardPanelCard } from "./components/StoryboardPanelCard";
import { StoryboardAiToolbar } from "./components/StoryboardAiToolbar";
import DeleteConfirmModal from "@/shared/ui/modal/DeleteConfirmModal";
import { GeneratedPanel } from "@/types";

export interface StoryboardWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
  panels?: GeneratedPanel[];
}

export const StoryboardWorkspace: React.FC<StoryboardWorkspaceProps> = ({
  onTriggerFeedback,
  appLogic,
}) => {
  const projectStore = useProjectStore();
  const activeData = projectStore?.activeProjectData;

  const panels: GeneratedPanel[] =
    appLogic?.panels ?? activeData?.panels ?? [];
  const setPanels =
    appLogic?.setPanels ??
    ((updater: any) => {
      const next = typeof updater === "function" ? updater(panels) : updater;
      projectStore?.setPanels?.(next);
    });

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<StoryboardFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Delete Modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    targetIndex?: number;
    count?: number;
  } | null>(null);

  // Total calculated duration
  const totalDurationStr = useMemo(() => {
    const totalSec = panels.reduce((acc, p) => acc + (p.duration || 3.5), 0);
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [panels]);

  // Card Selection
  const handleCardSelect = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    setSelectedIndices((prev) => {
      if (ctrlOrMeta) {
        return prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      }
      return prev.includes(idx) && prev.length === 1 ? [] : [idx];
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (selectedIndices.length === panels.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(panels.map((_, i) => i));
    }
  }, [selectedIndices.length, panels]);

  const handleClearSelection = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  // Panel Dialogue updates
  const handleUpdateDialogue = useCallback(
    (idx: number, dialogue: string) => {
      const updated = panels.map((p, i) =>
        i === idx ? { ...p, speech_text: dialogue, narrative: dialogue } : p
      );
      setPanels(updated);
      onTriggerFeedback?.(`Updated dialogue for Panel #${idx + 1}`);
    },
    [panels, setPanels, onTriggerFeedback]
  );

  // Delete Handlers Opening Confirmation Modal
  const handleDeleteSelected = useCallback(() => {
    if (selectedIndices.length === 0) return;
    setDeleteModalState({
      isOpen: true,
      type: "bulk",
      count: selectedIndices.length,
    });
  }, [selectedIndices.length]);

  const handleDeleteSingle = useCallback((idx: number) => {
    setDeleteModalState({
      isOpen: true,
      type: "single",
      targetIndex: idx,
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteModalState) return;

    if (
      deleteModalState.type === "single" &&
      deleteModalState.targetIndex !== undefined
    ) {
      const idx = deleteModalState.targetIndex;
      const updated = panels.filter((_, i) => i !== idx);
      setPanels(updated);
      onTriggerFeedback?.(`Removed Panel #${idx + 1} from storyboard`);
    } else if (deleteModalState.type === "bulk") {
      const set = new Set(selectedIndices);
      const updated = panels.filter((_, i) => !set.has(i));
      setPanels(updated);
      onTriggerFeedback?.(`Removed ${selectedIndices.length} panels`);
      setSelectedIndices([]);
    }

    setDeleteModalState(null);
  }, [deleteModalState, panels, selectedIndices, setPanels, onTriggerFeedback]);

  // Preview Playback
  const handlePlayPreview = useCallback(
    (panel: GeneratedPanel, index: number) => {
      if (appLogic?.setCurrentPanelIndex) {
        appLogic.setCurrentPanelIndex(index);
      }
      onTriggerFeedback?.(`Playing preview for Panel #${index + 1}`);
    },
    [appLogic, onTriggerFeedback]
  );

  // Open Image Studio
  const handleOpenEditor = useCallback(
    (idx: number) => {
      if (appLogic?.setEditingImageIdx) {
        appLogic.setEditingImageIdx(idx);
      }
      onTriggerFeedback?.(`Opened Panel #${idx + 1} in Editor`);
    },
    [appLogic, onTriggerFeedback]
  );

  // Filter & Sort Panels
  const filteredPanels = useMemo(() => {
    let list = panels.map((panel, index) => {
      const isSelected = selectedIndices.includes(index);
      return { panel, index, isSelected };
    });

    if (activeTab === "dialogue") {
      list = list.filter(
        (i) =>
          !!(
            i.panel.speech_text ||
            i.panel.narrative ||
            (i.panel as any).dialogue
          )
      );
    } else if (activeTab === "camera") {
      list = list.filter(
        (i) => !!(i.panel.motion_type || (i.panel as any).camera_motion)
      );
    } else if (activeTab === "audio") {
      list = list.filter(
        (i) =>
          !!(
            i.panel.speech_audio_url ||
            i.panel.audio_url ||
            i.panel.sfx
          )
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          `panel #${i.index + 1}`.includes(q) ||
          String(i.index + 1).includes(q) ||
          (i.panel.speech_text &&
            i.panel.speech_text.toLowerCase().includes(q)) ||
          (i.panel.narrative &&
            i.panel.narrative.toLowerCase().includes(q))
      );
    }

    if (sortOrder === "desc") {
      list.reverse();
    }

    return list;
  }, [panels, selectedIndices, activeTab, searchQuery, sortOrder]);

  const isAllSelected =
    panels.length > 0 && selectedIndices.length === panels.length;

  return (
    <WorkspaceLayout>
      {/* ── 1. Storyboard Toolbar Header ──────────────────────────────────── */}
      <StoryboardWorkspaceHeader
        panelCount={panels.length}
        totalDuration={totalDurationStr}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
        selectedCount={selectedIndices.length}
        isAllSelected={isAllSelected}
        onToggleSelectAll={handleToggleSelectAll}
        onAutoVoiceover={() => onTriggerFeedback?.("AI Voiceover batch triggered")}
        onAutoCameraPan={() => onTriggerFeedback?.("AI Camera motions assigned")}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={handleClearSelection}
        onPlayStoryboard={() => onTriggerFeedback?.("Storyboard playback started")}
      />

      {/* ── 2. AI Toolbar ─────────────────────────────────────────────────── */}
      <StoryboardAiToolbar
        onTriggerFeedback={(msg) => onTriggerFeedback?.(msg)}
      />

      {/* ── 3. Content Panel List ─────────────────────────────────────────── */}
      <WorkspaceLayout.Content>
        {filteredPanels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 font-mono text-xs space-y-2.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Film className="h-5 w-5" />
            </div>
            <p className="font-bold text-neutral-200">No Storyboard Panels</p>
            <p className="text-[10px] text-neutral-500 max-w-[240px]">
              {panels.length === 0
                ? "Go to Imported Assets to add frames into your storyboard sequence."
                : "No panels match the current filter or search criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1 pb-4">
            {filteredPanels.map(({ panel, index, isSelected }) => (
              <StoryboardPanelCard
                key={`storyboard-panel-${panel.id || index}`}
                panel={panel}
                index={index}
                isSelected={isSelected}
                onSelect={handleCardSelect}
                onPlayPreview={handlePlayPreview}
                onOpenEditor={handleOpenEditor}
                onDelete={handleDeleteSingle}
                onUpdateDialogue={handleUpdateDialogue}
              />
            ))}
          </div>
        )}
      </WorkspaceLayout.Content>

      <WorkspaceLayout.Footer
        text={`Sonikoma Storyboard • ${panels.length} panels • ${totalDurationStr}`}
      />

      {/* ── 4. Delete Confirmation Modal ──────────────────────────────────── */}
      {deleteModalState?.isOpen && (
        <DeleteConfirmModal
          title={
            deleteModalState.type === "single"
              ? `Remove Panel #${(deleteModalState.targetIndex ?? 0) + 1}`
              : `Remove ${deleteModalState.count} Panels`
          }
          message={
            deleteModalState.type === "single"
              ? `Are you sure you want to remove Panel #${
                  (deleteModalState.targetIndex ?? 0) + 1
                } from the storyboard sequence?`
              : `Are you sure you want to remove ${deleteModalState.count} selected panels from the storyboard sequence?`
          }
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalState(null)}
        />
      )}
    </WorkspaceLayout>
  );
};

export default StoryboardWorkspace;

import React, { useState, useMemo, useCallback } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import {
  ImportedAssetsWorkspaceHeader,
  AssetFilterTab,
} from "./components/ImportedAssetsWorkspaceHeader";
import { ImportedAssetsCard } from "./components/ImportedAssetsCard";
import { ImportedAssetsAiToolbar } from "./components/ImportedAssetsAiToolbar";
import { ImportedAssetsUploadZone } from "./components/ImportedAssetsUploadZone";
import DeleteConfirmModal from "@/shared/ui/modal/DeleteConfirmModal";

export interface ImportedAssetsWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
  scrapedImages?: any[];
  panels?: any[];
}

export const ImportedAssetsWorkspace: React.FC<ImportedAssetsWorkspaceProps> = ({
  onTriggerFeedback,
  appLogic,
}) => {
  const projectStore = useProjectStore();
  const activeData = projectStore?.activeProjectData;

  const scrapedImages: string[] =
    appLogic?.scrapedImages ?? activeData?.scrapedImages ?? [];
  const setScrapedImages =
    appLogic?.setScrapedImages ??
    ((updater: any) => {
      const next =
        typeof updater === "function" ? updater(scrapedImages) : updater;
      if (activeData) {
        projectStore.setActiveProject({ ...activeData, scrapedImages: next });
      }
    });

  const panels = appLogic?.panels ?? activeData?.panels ?? [];
  const panelUrls = useMemo(
    () =>
      new Set(
        panels.map((p: any) => p.image_url || p.imageUrl || p.original_url)
      ),
    [panels]
  );

  // Filter & Selection states
  const [activeTab, setActiveTab] = useState<AssetFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [mergingIndex, setMergingIndex] = useState<number | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    targetIndex?: number;
    count?: number;
  } | null>(null);

  // Toggle Favorite
  const toggleFavorite = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // Card Selection with Shift + Click range support
  const handleCardSelect = useCallback(
    (idx: number, url: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const shiftKey = e.shiftKey;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      setSelectedUrls((prev) => {
        if (shiftKey && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, idx);
          const end = Math.max(lastSelectedIndex, idx);
          const rangeItems = scrapedImages.slice(start, end + 1);
          return Array.from(new Set([...prev, ...rangeItems]));
        } else if (ctrlOrMeta) {
          return prev.includes(url)
            ? prev.filter((u) => u !== url)
            : [...prev, url];
        } else {
          return prev.includes(url) && prev.length === 1 ? [] : [url];
        }
      });
      setLastSelectedIndex(idx);
    },
    [scrapedImages, lastSelectedIndex]
  );

  // Bulk Selection Handlers
  const handleSelectAllToggle = useCallback(() => {
    if (selectedUrls.length === scrapedImages.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls([...scrapedImages]);
    }
  }, [selectedUrls.length, scrapedImages]);

  const handleClearSelection = useCallback(() => {
    setSelectedUrls([]);
    setLastSelectedIndex(null);
  }, []);

  // Actions
  const handleAddToTimelineSingle = useCallback(
    (imgUrl: string, idx: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (appLogic?.addPanelsToStoryboard) {
        appLogic.addPanelsToStoryboard([imgUrl]);
      } else if (projectStore?.addPanel) {
        projectStore.addPanel({
          image_url: imgUrl,
          panel_index: panels.length + 1,
        });
      }
      onTriggerFeedback?.(`Frame #${idx + 1} added to timeline`);
    },
    [appLogic, projectStore, panels.length, onTriggerFeedback]
  );

  const handleAddSelectedToTimeline = useCallback(() => {
    if (selectedUrls.length === 0) return;
    if (appLogic?.addPanelsToStoryboard) {
      appLogic.addPanelsToStoryboard(selectedUrls);
    } else if (projectStore?.addPanel) {
      selectedUrls.forEach((url, idx) => {
        projectStore.addPanel({
          image_url: url,
          panel_index: panels.length + idx + 1,
        });
      });
    }
    onTriggerFeedback?.(`Added ${selectedUrls.length} frames to timeline`);
    setSelectedUrls([]);
  }, [selectedUrls, appLogic, projectStore, panels.length, onTriggerFeedback]);

  // Delete Handlers Opening Confirmation Modal
  const handleDeleteSelected = useCallback(() => {
    if (selectedUrls.length === 0) return;
    setDeleteModalState({
      isOpen: true,
      type: "bulk",
      count: selectedUrls.length,
    });
  }, [selectedUrls.length]);

  const handleDeleteSingle = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
      const updated = scrapedImages.filter((_, i) => i !== idx);
      setScrapedImages(updated);
      onTriggerFeedback?.(`Deleted Frame #${idx + 1}`);
    } else if (deleteModalState.type === "bulk") {
      const toDelete = new Set(selectedUrls);
      const updated = scrapedImages.filter((url) => !toDelete.has(url));
      setScrapedImages(updated);
      onTriggerFeedback?.(`Deleted ${selectedUrls.length} frame(s)`);
      setSelectedUrls([]);
    }

    setDeleteModalState(null);
  }, [deleteModalState, scrapedImages, selectedUrls, setScrapedImages, onTriggerFeedback]);

  const handleMergeWithNext = useCallback(
    async (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (idx >= scrapedImages.length - 1) return;
      setMergingIndex(idx);
      try {
        if (appLogic?.handleStitchWithNext) {
          await appLogic.handleStitchWithNext(idx);
        } else if (appLogic?.handleMergeWithNext) {
          await appLogic.handleMergeWithNext(idx);
        }
        onTriggerFeedback?.(`Merged Frame #${idx + 1} with #${idx + 2}`);
      } finally {
        setMergingIndex(null);
      }
    },
    [scrapedImages.length, appLogic, onTriggerFeedback]
  );

  const handleOpenEditor = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (appLogic?.setEditingImageIdx) {
        appLogic.setEditingImageIdx(idx);
      }
      onTriggerFeedback?.(`Opened Frame #${idx + 1} in Editor`);
    },
    [appLogic, onTriggerFeedback]
  );

  // Filter & Sort Assets
  const filteredAssets = useMemo(() => {
    let list = scrapedImages.map((url, index) => {
      const isAssigned = panelUrls.has(url);
      const isSelected = selectedUrls.includes(url);
      const isFav = !!favorites[index];
      return { url, index, isAssigned, isSelected, isFav };
    });

    if (activeTab === "timeline") list = list.filter((i) => i.isAssigned);
    if (activeTab === "unassigned") list = list.filter((i) => !i.isAssigned);
    if (activeTab === "favorites") list = list.filter((i) => i.isFav);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          `frame #${i.index + 1}`.includes(q) ||
          String(i.index + 1).includes(q)
      );
    }

    if (sortOrder === "desc") {
      list.reverse();
    }

    return list;
  }, [scrapedImages, panelUrls, selectedUrls, activeTab, searchQuery, sortOrder, favorites]);

  const isAllSelected =
    scrapedImages.length > 0 && selectedUrls.length === scrapedImages.length;

  return (
    <WorkspaceLayout>
      {/* ── 1. Workspace Toolbar Header ───────────────────────────────────── */}
      <ImportedAssetsWorkspaceHeader
        filteredCount={filteredAssets.length}
        totalCount={scrapedImages.length}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
        selectedCount={selectedUrls.length}
        isAllSelected={isAllSelected}
        onToggleSelectAll={handleSelectAllToggle}
        onAddSelectedToTimeline={handleAddSelectedToTimeline}
        onAutoCropSelected={appLogic?.handleAutoCropSelected}
        onCleanBubblesSelected={appLogic?.handleCleanBubblesSelected}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={handleClearSelection}
      />

      {/* ── 2. Contextual AI Action Toolbar ───────────────────────────────── */}
      <ImportedAssetsAiToolbar
        onTriggerFeedback={(msg) => onTriggerFeedback?.(msg)}
      />

      {/* ── 3. Content Area with Grid of Separated Card Components ────────── */}
      <WorkspaceLayout.Content>
        {filteredAssets.length === 0 ? (
          <ImportedAssetsUploadZone
            isEmpty={true}
            onOpenBrowser={() => onTriggerFeedback?.("Upload file browser opened")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pt-1 pb-4">
            {filteredAssets.map(({ url, index, isAssigned, isSelected, isFav }) => (
              <ImportedAssetsCard
                key={`${url}-${index}`}
                url={url}
                index={index}
                isAssigned={isAssigned}
                isSelected={isSelected}
                isFav={isFav}
                isMerging={mergingIndex === index}
                totalImagesCount={scrapedImages.length}
                onSelect={handleCardSelect}
                onToggleFavorite={toggleFavorite}
                onAddToTimeline={handleAddToTimelineSingle}
                onMergeWithNext={handleMergeWithNext}
                onOpenEditor={handleOpenEditor}
                onDelete={handleDeleteSingle}
              />
            ))}
          </div>
        )}
      </WorkspaceLayout.Content>

      <WorkspaceLayout.Footer
        text={`Sonikoma Imported Assets • ${scrapedImages.length} frames`}
      />

      {/* ── 4. Delete Confirmation Modal ──────────────────────────────────── */}
      {deleteModalState?.isOpen && (
        <DeleteConfirmModal
          title={
            deleteModalState.type === "single"
              ? `Delete Frame #${(deleteModalState.targetIndex ?? 0) + 1}`
              : `Delete ${deleteModalState.count} Frames`
          }
          message={
            deleteModalState.type === "single"
              ? `Are you sure you want to permanently delete Frame #${
                  (deleteModalState.targetIndex ?? 0) + 1
                }? This action will remove the asset from your project.`
              : `Are you sure you want to permanently delete ${deleteModalState.count} selected frames from this project? This action cannot be undone.`
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalState(null)}
        />
      )}
    </WorkspaceLayout>
  );
};

export default ImportedAssetsWorkspace;

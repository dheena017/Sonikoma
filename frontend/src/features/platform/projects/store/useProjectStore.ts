import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StoryMemoryState } from "@/shared/types/models";
import {
  type ActiveProjectData,
  type AudioSettings,
  type AutoCropSettings,
  type MissingProjectDetails,
  type PanelItem,
  type ProjectMetadata,
  type ProjectSettingsPayload,
  type ProjectStateMode,
  type ProjectStoreState,
  type VideoSettings,
  type WorkspaceContext,
} from "./projectStoreTypes";
import {
  STORAGE_KEYS,
  safeLocalStorage,
  readJsonFromStorage,
  writeJsonToStorage,
  readStoredProjectImport,
  isTempProject,
  getStoredAuthToken,
  clearStoredProjectSession,
  setActiveProjectSession,
  writeProjectSnapshot,
  buildMissingProjectInfo,
} from "./projectStoreStorage";
import {
  calculateAssetCounts,
  normalizeProjectData,
  readStoredProjectStoreState,
  readPersistedProjectSnapshot,
  applyWorkspaceContextChange,
  applyLocalSettings,
  parseHydratedProjectJson,
  fetchProjectFromServer,
  reorderPanelArray,
  pushHistorySnapshot,
  computeSpeechDuration,
} from "./projectStoreHelpers";

// Re-export all modular interfaces, storage keys & helpers for 100% backward compatibility
export * from "./projectStoreTypes";
export * from "./projectStoreStorage";
export * from "./projectStoreHelpers";

let _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Call this after any panel/data change to schedule a background save.
 * Resets the timer if called again before the delay expires.
 */
export function scheduleAutoSave(fetchClient?: any, delayMs = 2000): void {
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    _autoSaveTimer = null;
    const store = useProjectStore.getState();
    if (store.isDirty && store.activeProjectId && !store.isSaving) {
      await store.saveActiveProject(fetchClient);
    }
  }, delayMs);
}

// =============================================================================
// 3. Zustand Store Definition with Reload Resilience & History Stack
// =============================================================================

const inFlightHydrations = new Map<string, Promise<void>>();

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      // State
      activeProjectId: null,
      activeProjectData: null,
      selectedPanelIndex: 0,
      projectState: "idle",
      missingProjectInfo: null,
      storyMemory: null,
      isDrawerOpen: false,
      isDirty: false,
      isHydrating: false,
      isSaving: false,
      lastSavedAt: null,
      isEpisodeCollapsed: false,

      // Search & Filters
      searchQuery: "",
      filterMotion: null,

      // Undo / Redo State
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      // ── Select Active Project ID ──────────────────────────────────────────
      setActiveProjectId: (id) =>
        set((state) => {
          if (state.activeProjectId === id && state.projectState === "active")
            return state;
          if (!id) {
            setActiveProjectSession(null, null);
            return {
              activeProjectId: null,
              activeProjectData: null,
              selectedPanelIndex: 0,
              projectState: "idle",
              missingProjectInfo: null,
              history: [],
              historyIndex: -1,
              canUndo: false,
              canRedo: false,
            };
          }

          setActiveProjectSession(
            id,
            state.activeProjectData?.project?.job_id ?? null
          );
          const hasMatchingData =
            state.activeProjectData?.project?.project_id === id;
          return {
            activeProjectId: id,
            projectState: hasMatchingData ? "active" : "loading",
          };
        }),

      // ── Set Active Project Data ───────────────────────────────────────────
      setActiveProject: (data) => {
        const normalized = normalizeProjectData(data);
        if (normalized) {
          const snapshot = pushHistorySnapshot([], -1, normalized);
          setActiveProjectSession(
            normalized.project.project_id ?? null,
            normalized.project.job_id ?? null
          );
          writeProjectSnapshot(normalized);
          set({
            activeProjectData: normalized,
            activeProjectId: normalized.project.project_id ?? null,
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
            ...snapshot,
          });
        } else {
          setActiveProjectSession(null, null);
          writeProjectSnapshot(null);
          set({
            activeProjectData: null,
            activeProjectId: null,
            projectState: "idle",
            missingProjectInfo: null,
            isHydrating: false,
            history: [],
            historyIndex: -1,
            canUndo: false,
            canRedo: false,
          });
        }
      },

      // ── Undo / Redo Actions ───────────────────────────────────────────────
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const targetData = history[prevIndex];
          set({
            activeProjectData: targetData,
            historyIndex: prevIndex,
            canUndo: prevIndex > 0,
            canRedo: true,
            isDirty: true,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const targetData = history[nextIndex];
          set({
            activeProjectData: targetData,
            historyIndex: nextIndex,
            canUndo: true,
            canRedo: nextIndex < history.length - 1,
            isDirty: true,
          });
        }
      },

      // ── Loading & Missing State Handlers ──────────────────────────────────
      setProjectLoading: () =>
        set({
          projectState: "loading",
          isHydrating: true,
        }),

      setProjectMissing: (missingId, options) =>
        set({
          projectState: "missing",
          missingProjectInfo: buildMissingProjectInfo(
            missingId,
            options?.isJobId
          ),
          isHydrating: false,
        }),

      // ── Workspace Context Switch ──────────────────────────────────────────
      setWorkspaceContext: (ctx) =>
        set((state) =>
          applyWorkspaceContextChange(state.activeProjectData, ctx)
        ),

      // ── Hydrate / Fetch From Backend (Preserves Temp & Saved Projects on Reload) ──
      hydrateActiveProject: async (targetId, fetchClient) => {
        const persistedSnapshot = readPersistedProjectSnapshot();
        const fallbackId =
          targetId ??
          get().activeProjectId ??
          persistedSnapshot?.project?.project_id ??
          null;
        const idToHydrate = fallbackId;
        const currentData = get().activeProjectData;

        if (!idToHydrate) {
          const restoredFromPersist = persistedSnapshot;
          if (restoredFromPersist) {
            const favProjectId = restoredFromPersist.project.project_id;
            setActiveProjectSession(
              favProjectId,
              restoredFromPersist.project.job_id ?? null
            );
            set({
              activeProjectId: favProjectId,
              activeProjectData: restoredFromPersist,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
            });
            return;
          }
          if (currentData) {
            set({ projectState: "active", isHydrating: false });
            return;
          }
          set({
            activeProjectData: null,
            projectState: "idle",
            missingProjectInfo: null,
            isHydrating: false,
          });
          return;
        }

        // Deduplicate in-flight hydration requests for the same targetId
        if (inFlightHydrations.has(idToHydrate)) {
          return inFlightHydrations.get(idToHydrate)!;
        }

        const runHydration = async () => {
          // 🌟 Temp projects exist only in localStorage or backend transfer -> Keep active immediately!
          if (isTempProject(idToHydrate)) {
            // If current in-memory project matches this exact id, keep it
            if (
              currentData &&
              currentData.project &&
              currentData.project.project_id === idToHydrate &&
              (currentData.panels?.length > 0 ||
                (currentData.scrapedImages &&
                  currentData.scrapedImages.length > 0))
            ) {
              set({
                activeProjectId: idToHydrate,
                projectState: "active",
                missingProjectInfo: null,
                isHydrating: false,
              });
              return;
            }

            // 1. Check if this temp project has transferred storyboard panels/images from backend
            try {
              const transferRes = await fetch(
                `/api/v1/projects/transfer/${encodeURIComponent(idToHydrate)}`
              );
              if (transferRes.ok) {
                const transferData = await transferRes.json();
                if (
                  transferData &&
                  transferData.success &&
                  Array.isArray(transferData.panels) &&
                  transferData.panels.length > 0
                ) {
                  const transferredPanels: PanelItem[] =
                    transferData.panels.map((p: any, idx: number) => ({
                      id: p.id || idx + 1,
                      panel_index: p.panel_index ?? idx,
                      prompt:
                        p.prompt ||
                        p.visual_description ||
                        p.speech_text ||
                        `Scene ${idx + 1}`,
                      image_url: p.image_url || p.imageUrl || "",
                      original_url:
                        p.original_url || p.imageUrl || p.image_url || "",
                      speech_text: p.speech_text || p.dialogueText || "",
                      narrative: p.narrative || p.narrativeText || "",
                      sfx: p.sfx || "",
                      duration: p.duration || 0,
                      motion_type: p.motion_type || p.motionPreset || "",
                      visual_description:
                        p.visual_description || p.visualDescription || "",
                      audio_url: p.audio_url || p.audioUrl || "",
                      narrative_audio_url:
                        p.narrative_audio_url || p.narrativeAudioUrl || "",
                      speech_audio_url: p.speech_audio_url || p.audioUrl || "",
                    }));

                  const transferredImages: string[] =
                    Array.isArray(transferData.scraped_images) &&
                    transferData.scraped_images.length > 0
                      ? transferData.scraped_images
                      : transferredPanels
                          .map((p) => p.image_url)
                          .filter(Boolean);

                  const title =
                    transferData.title ||
                    transferData.series_title ||
                    "Imported Comic";

                  const newActiveData: ActiveProjectData = {
                    project: {
                      project_id: idToHydrate,
                      title: title,
                      url: transferData.url || "",
                      chapter_title: transferData.chapter_title || "",
                      cover_image: transferredImages[0] || "",
                    },
                    panels: transferredPanels,
                    scrapedImages: transferredImages,
                  };

                  set({
                    activeProjectId: idToHydrate,
                    activeProjectData: newActiveData,
                    projectState: "active",
                    missingProjectInfo: null,
                    isHydrating: false,
                  });
                  return;
                }
              }
            } catch (e) {
              console.warn(
                "[useProjectStore] Error checking transfer project:",
                e
              );
            }

            // 2. Check localStorage for sonikoma_import_project
            try {
              const importedProject = readStoredProjectImport();
              if (
                importedProject &&
                (importedProject.project_id === idToHydrate ||
                  !importedProject.project_id)
              ) {
                const parsed = importedProject;
                if (
                  parsed &&
                  Array.isArray(parsed.panels) &&
                  parsed.panels.length > 0
                ) {
                  const transferredPanels: PanelItem[] = parsed.panels.map(
                    (p: any, idx: number) => ({
                      id: p.id || idx + 1,
                      panel_index: p.panel_index ?? idx,
                      prompt:
                        p.prompt ||
                        p.visual_description ||
                        p.speech_text ||
                        `Scene ${idx + 1}`,
                      image_url: p.image_url || p.imageUrl || "",
                      original_url:
                        p.original_url || p.imageUrl || p.image_url || "",
                      speech_text: p.speech_text || p.dialogueText || "",
                      narrative: p.narrative || p.narrativeText || "",
                      sfx: p.sfx || "",
                      duration: p.duration || 0,
                      motion_type: p.motion_type || p.motionPreset || "",
                      visual_description:
                        p.visual_description || p.visualDescription || "",
                    })
                  );

                  const transferredImages: string[] =
                    Array.isArray(parsed.scraped_images) &&
                    parsed.scraped_images.length > 0
                      ? parsed.scraped_images
                      : transferredPanels
                          .map((p) => p.image_url)
                          .filter(Boolean);

                  const newActiveData: ActiveProjectData = {
                    project: {
                      project_id: idToHydrate,
                      title:
                        parsed.title || parsed.series_title || "Imported Comic",
                      url: parsed.url || "",
                      chapter_title: parsed.chapter_title || "",
                      cover_image: transferredImages[0] || "",
                    },
                    panels: transferredPanels,
                    scrapedImages: transferredImages,
                  };

                  set({
                    activeProjectId: idToHydrate,
                    activeProjectData: newActiveData,
                    projectState: "active",
                    missingProjectInfo: null,
                    isHydrating: false,
                  });
                  return;
                }
              }
            } catch (e) {
              console.error(
                "Error reading import project from local storage:",
                e
              );
            }

            // 3. Check localStorage active-project-store for matching or any temp project with data
            try {
              const storeData = readStoredProjectStoreState();
              if (storeData?.project) {
                // Exact match — always use it
                if (storeData.project.project_id === idToHydrate) {
                  set({
                    activeProjectId: idToHydrate,
                    activeProjectData: storeData,
                    projectState: "active",
                    missingProjectInfo: null,
                    isHydrating: false,
                  });
                  return;
                }
              }
            } catch (e) {
              console.error(
                "Error reading temp project from local storage:",
                e
              );
            }

            // 4. Check server for this project_id or chapter_slug (e.g. if saved to SQLite/Postgres)
            try {
              let serverProject = await fetchProjectFromServer(
                idToHydrate,
                fetchClient
              );
              if (!serverProject && typeof window !== "undefined") {
                const slugMatch = window.location.pathname.match(
                  /\/chapters\/([^\/\?]+)/
                );
                if (slugMatch && slugMatch[1] && slugMatch[1] !== idToHydrate) {
                  serverProject = await fetchProjectFromServer(
                    slugMatch[1],
                    fetchClient
                  );
                }
              }
              if (serverProject) {
                const snapshot = pushHistorySnapshot([], -1, serverProject);
                set({
                  activeProjectId: serverProject.project.project_id,
                  activeProjectData: serverProject,
                  projectState: "active",
                  missingProjectInfo: null,
                  isHydrating: false,
                  ...snapshot,
                });
                return;
              }
            } catch (e) {
              console.warn(
                "[useProjectStore] Server check for temp project failed:",
                e
              );
            }

            // 5. Initialize fresh local draft — no stored or server data found for this temp project
            const draftData: ActiveProjectData = {
              project: {
                project_id: idToHydrate,
                title: "Draft Project",
                url: "",
              },
              panels: [],
              scrapedImages: [],
            };
            set({
              activeProjectId: idToHydrate,
              activeProjectData: draftData,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
            });
            return;
          }

          // 🌟 Permanent saved projects -> Fetch latest server state
          set({
            isHydrating: true,
            projectState: currentData ? "active" : "loading",
          });

          try {
            let parsed = await fetchProjectFromServer(idToHydrate, fetchClient);

            // If not found by ID, also check if current URL contains a chapter slug
            if (!parsed && typeof window !== "undefined") {
              const slugMatch = window.location.pathname.match(
                /\/chapters\/([^\/\?]+)/
              );
              if (slugMatch && slugMatch[1] && slugMatch[1] !== idToHydrate) {
                parsed = await fetchProjectFromServer(
                  slugMatch[1],
                  fetchClient
                );
              }
            }

            if (!parsed) {
              if (
                currentData &&
                currentData.project?.project_id === idToHydrate
              ) {
                set({ projectState: "active", isHydrating: false });
                return;
              }
              get().setProjectMissing(idToHydrate, {
                isJobId: idToHydrate.startsWith("job_"),
              });
              return;
            }

            // Preserve in-memory scrapedImages if server response doesn't have them
            if (
              (!parsed.scrapedImages || parsed.scrapedImages.length === 0) &&
              currentData?.project?.project_id === idToHydrate &&
              currentData?.scrapedImages?.length
            ) {
              parsed.scrapedImages = currentData.scrapedImages;
            }

            const snapshot = pushHistorySnapshot([], -1, parsed);

            set({
              activeProjectId: parsed.project.project_id,
              activeProjectData: parsed,
              projectState: "active",
              missingProjectInfo: null,
              isHydrating: false,
              ...snapshot,
            });
          } catch (err) {
            console.error("Error in hydrateActiveProject:", err);
            if (
              currentData &&
              currentData.project?.project_id === idToHydrate
            ) {
              set({ projectState: "active", isHydrating: false });
              return;
            }
            get().setProjectMissing(idToHydrate, {
              isJobId: idToHydrate.startsWith("job_"),
            });
          }
        };

        const hydrationPromise = runHydration();
        inFlightHydrations.set(idToHydrate, hydrationPromise);
        try {
          await hydrationPromise;
        } finally {
          inFlightHydrations.delete(idToHydrate);
        }
      },

      // ── Save Entire Active Project to Backend ─────────────────────────────
      saveActiveProject: async (fetchClient) => {
        const { activeProjectId, activeProjectData, isSaving } = get();
        if (!activeProjectId || !activeProjectData) return false;
        if (isSaving) return true;

        set({ isSaving: true });
        try {
          const fetcher = fetchClient || window.fetch;
          const token = getStoredAuthToken();

          const currentAudioSettings =
            activeProjectData.project.audio_settings || {};
          const scrapedImgs =
            activeProjectData.scrapedImages &&
            activeProjectData.scrapedImages.length > 0
              ? activeProjectData.scrapedImages
              : currentAudioSettings.scraped_images || [];

          const panelsCount =
            activeProjectData.panels && activeProjectData.panels.length > 0
              ? activeProjectData.panels.length
              : 0;

          const importedCount =
            scrapedImgs.length > 0
              ? scrapedImgs.length
              : activeProjectData.project.imported_assets_count || 0;

          const res = await fetcher(
            `/api/v1/projects/${encodeURIComponent(activeProjectId)}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                url:
                  activeProjectData.project.url ||
                  activeProjectData.project.original_url ||
                  "",
                episode:
                  activeProjectData.project.episode ||
                  (activeProjectData.project as any).chapterNumber ||
                  "Chapter 1",
                title: activeProjectData.project.title,
                genre: activeProjectData.project.genre,
                author: activeProjectData.project.author,
                synopsis: activeProjectData.project.synopsis,
                cover_image: activeProjectData.project.cover_image,
                status: activeProjectData.project.status || "ready",
                panels: activeProjectData.panels?.map((p: any) => ({
                  ...p,
                  original_url:
                    p.original_url ||
                    p.original_image_url ||
                    p.originalUrl ||
                    activeProjectData.project.url ||
                    activeProjectData.project.original_url ||
                    p.image_url,
                })),
                panels_count: panelsCount,
                imported_assets_count: importedCount,
                scraped_images: scrapedImgs,
                audio_settings: {
                  ...currentAudioSettings,
                  scraped_images: scrapedImgs,
                  imported_assets_count: importedCount,
                },
                video_settings: activeProjectData.project.video_settings,
                autocrop_settings: activeProjectData.project.autocrop_settings,
              }),
            }
          );

          if (!res.ok) throw new Error("Save failed");

          set({
            isSaving: false,
            isDirty: false,
            lastSavedAt: new Date().toLocaleTimeString(),
          });
          return true;
        } catch (err) {
          console.error("Error saving active project:", err);
          set({ isSaving: false });
          return false;
        }
      },

      // ── Panel Direct Manipulation Actions (With Undo/Redo Snapshots) ──────
      setSelectedPanelIndex: (index) => set({ selectedPanelIndex: index }),

      updatePanel: (index, updates) => {
        const { activeProjectData, history, historyIndex, storyMemory } = get();
        if (!activeProjectData || !activeProjectData.panels[index]) return;

        const updatedPanels = [...activeProjectData.panels];
        updatedPanels[index] = { ...updatedPanels[index], ...updates };

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        let newStoryMemory = storyMemory;
        if (
          updates.speaker_name &&
          typeof updates.speaker_name === "string" &&
          updates.speaker_name.trim()
        ) {
          const sName = updates.speaker_name.trim();
          const curChar = storyMemory?.characters?.[sName] || {
            gender: updates.speaker_gender || "neutral",
            voice:
              updates.voice ||
              updates.voiceActor ||
              (updates.speaker_gender === "female"
                ? "en-US-JennyNeural"
                : updates.speaker_gender === "child"
                ? "en-US-AnaNeural"
                : "en-US-GuyNeural"),
          };
          newStoryMemory = {
            current_scene: storyMemory?.current_scene || "",
            characters: {
              ...(storyMemory?.characters || {}),
              [sName]: {
                ...curChar,
                ...(updates.speaker_gender
                  ? { gender: updates.speaker_gender }
                  : {}),
                ...(updates.voice || updates.voiceActor
                  ? {
                      voice: updates.voice || updates.voiceActor,
                      is_user_locked: true,
                    }
                  : {}),
              },
            },
            dialogue_history: storyMemory?.dialogue_history || [],
            scene_history: storyMemory?.scene_history || [],
            last_updated_at: new Date().toISOString(),
          };
        }

        set({
          activeProjectData: updatedData,
          storyMemory: newStoryMemory,
          isDirty: true,
          ...snapshot,
        });
      },

      addPanel: (panel, atIndex) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = [...activeProjectData.panels];
        if (
          atIndex !== undefined &&
          atIndex >= 0 &&
          atIndex <= updatedPanels.length
        ) {
          updatedPanels.splice(atIndex, 0, panel);
        } else {
          updatedPanels.push(panel);
        }

        const reindexed = updatedPanels.map((p, idx) => ({
          ...p,
          panel_index: idx,
        }));

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: {
            ...activeProjectData.project,
            panels_count: reindexed.length,
          },
          panels: reindexed,
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      duplicatePanel: (index) => {
        const { activeProjectData } = get();
        if (
          !activeProjectData ||
          index < 0 ||
          index >= activeProjectData.panels.length
        )
          return;

        const targetPanel = activeProjectData.panels[index];
        const duplicated: PanelItem = {
          ...targetPanel,
          speech_text: targetPanel.speech_text
            ? `${targetPanel.speech_text} (Copy)`
            : "",
        };

        get().addPanel(duplicated, index + 1);
        get().setSelectedPanelIndex(index + 1);
      },

      removePanel: (index) => {
        const { activeProjectData, selectedPanelIndex, history, historyIndex } =
          get();
        if (
          !activeProjectData ||
          index < 0 ||
          index >= activeProjectData.panels.length
        )
          return;

        const updatedPanels = activeProjectData.panels
          .filter((_, idx) => idx !== index)
          .map((p, idx) => ({ ...p, panel_index: idx }));

        const nextSelectedIndex = Math.min(
          selectedPanelIndex,
          Math.max(0, updatedPanels.length - 1)
        );

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: {
            ...activeProjectData.project,
            panels_count: updatedPanels.length,
          },
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: nextSelectedIndex,
          isDirty: true,
          ...snapshot,
        });
      },

      reorderPanels: (startIndex, endIndex) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const reordered = reorderPanelArray(
          activeProjectData.panels,
          startIndex,
          endIndex
        );
        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: reordered,
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: endIndex,
          isDirty: true,
          ...snapshot,
        });
      },

      batchUpdatePanels: (indices, updates) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData || indices.length === 0) return;

        const indexSet = new Set(indices);
        const updatedPanels = activeProjectData.panels.map((p, idx) =>
          indexSet.has(idx) ? { ...p, ...updates } : p
        );

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          panels: updatedPanels,
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      setPanels: (panels) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const reindexed = panels.map((p, idx) => ({ ...p, panel_index: idx }));
        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: {
            ...activeProjectData.project,
            panels_count: reindexed.length,
          },
          panels: reindexed,
        };

        // Avoid pushing heavy undo/redo history snapshots if only transient flags (e.g. isAnalyzing) changed
        const prevPanels = activeProjectData.panels || [];
        const isOnlyTransient =
          prevPanels.length === reindexed.length &&
          prevPanels.every((p, i) => {
            const nextP = reindexed[i];
            return (
              p.image_url === nextP.image_url &&
              p.speech_text === nextP.speech_text &&
              p.duration === nextP.duration &&
              p.motion_type === nextP.motion_type &&
              p.sfx === nextP.sfx &&
              p.narrative === nextP.narrative &&
              p.visual_description === nextP.visual_description &&
              p.audio_url === nextP.audio_url &&
              p.narrative_audio_url === nextP.narrative_audio_url
            );
          });

        if (isOnlyTransient) {
          set({
            activeProjectData: updatedData,
          });
          return;
        }

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          isDirty: true,
          ...snapshot,
        });
      },

      clearAllPanels: () => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedData: ActiveProjectData = {
          ...activeProjectData,
          project: { ...activeProjectData.project, panels_count: 0 },
          panels: [],
        };

        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({
          activeProjectData: updatedData,
          selectedPanelIndex: 0,
          isDirty: true,
          ...snapshot,
        });
      },

      // ── Smart Automation & Studio Presets ─────────────────────────────────
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterMotion: (motion) => set({ filterMotion: motion }),

      getFilteredPanels: () => {
        const { activeProjectData, searchQuery, filterMotion } = get();
        if (!activeProjectData) return [];

        let result = activeProjectData.panels;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter(
            (p) =>
              (p.speech_text || "").toLowerCase().includes(q) ||
              (p.narrative || "").toLowerCase().includes(q) ||
              (p.sfx || "").toLowerCase().includes(q)
          );
        }
        if (filterMotion) {
          result = result.filter((p) => p.motion_type === filterMotion);
        }
        return result;
      },

      setGlobalPanelDuration: (duration) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({
          ...p,
          duration,
        }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      applyMotionPresetToAll: (motionType) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({
          ...p,
          motion_type: motionType,
        }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      applyStylePresetToAll: (presetName) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => ({
          ...p,
          filter_preset: presetName,
        }));
        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      autoCalculateSpeechDurations: (wordsPerSec = 2.5, bufferSec = 1.5) => {
        const { activeProjectData, history, historyIndex } = get();
        if (!activeProjectData) return;

        const updatedPanels = activeProjectData.panels.map((p) => {
          const text = `${p.speech_text || ""} ${p.narrative || ""}`;
          return {
            ...p,
            duration: computeSpeechDuration(text, wordsPerSec, bufferSec),
          };
        });

        const updatedData = { ...activeProjectData, panels: updatedPanels };
        const snapshot = pushHistorySnapshot(
          history,
          historyIndex,
          updatedData
        );

        set({ activeProjectData: updatedData, isDirty: true, ...snapshot });
      },

      // ── Import / Export Backup Actions ────────────────────────────────────
      exportProjectAsJson: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return null;
        return JSON.stringify(activeProjectData, null, 2);
      },

      importProjectFromJson: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!parsed.project || !Array.isArray(parsed.panels)) return false;
          get().setActiveProject(parsed);
          return true;
        } catch {
          return false;
        }
      },

      // ── Computed Statistics Helpers ───────────────────────────────────────
      getTotalDuration: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return 0;
        return activeProjectData.panels.reduce(
          (sum, p) => sum + (p.duration || 0),
          0
        );
      },

      getTotalWordCount: () => {
        const { activeProjectData } = get();
        if (!activeProjectData) return 0;
        return activeProjectData.panels.reduce((count, p) => {
          const text = `${p.speech_text || ""} ${p.narrative || ""}`.trim();
          return count + (text ? text.split(/\s+/).length : 0);
        }, 0);
      },

      // ── Update Project Settings ───────────────────────────────────────────
      updateProjectSettings: async (settings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({
          activeProjectData: applyLocalSettings(activeProjectData, settings),
          isDirty: true,
        });
        return true;
      },

      // ── Update Video Settings ─────────────────────────────────────────────
      updateVideoSettings: async (videoSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({
          activeProjectData: applyLocalSettings(activeProjectData, {
            video_settings: videoSettings,
          }),
          isDirty: true,
        });
        return true;
      },

      // ── Update Audio Settings ─────────────────────────────────────────────
      updateAudioSettings: async (audioSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({
          activeProjectData: applyLocalSettings(activeProjectData, {
            audio_settings: audioSettings,
          }),
          isDirty: true,
        });
        return true;
      },

      // ── Update AutoCrop Settings ──────────────────────────────────────────
      updateAutoCropSettings: async (autoCropSettings) => {
        const { activeProjectId, activeProjectData } = get();
        if (!activeProjectId) return false;
        set({
          activeProjectData: applyLocalSettings(activeProjectData, {
            autocrop_settings: autoCropSettings,
          }),
          isDirty: true,
        });
        return true;
      },

      // ── Story Memory Actions ──────────────────────────────────────────────
      updateStoryMemory: (memoryUpdates) =>
        set((state) => ({
          storyMemory: state.storyMemory
            ? {
                ...state.storyMemory,
                ...memoryUpdates,
                characters: {
                  ...state.storyMemory.characters,
                  ...(memoryUpdates.characters || {}),
                },
                dialogue_history:
                  memoryUpdates.dialogue_history ??
                  state.storyMemory.dialogue_history,
                scene_history:
                  memoryUpdates.scene_history ??
                  state.storyMemory.scene_history,
              }
            : ({
                current_scene: "",
                characters: {},
                dialogue_history: [],
                scene_history: [],
                ...memoryUpdates,
              } as StoryMemoryState),
          isDirty: true,
        })),

      resetStoryMemory: () => set({ storyMemory: null, isDirty: true }),

      // ── Reset Active Project ──────────────────────────────────────────────
      clearActiveProject: () => {
        clearStoredProjectSession();
        setActiveProjectSession(null, null);
        writeProjectSnapshot(null);
        set({
          activeProjectId: null,
          activeProjectData: null,
          selectedPanelIndex: 0,
          projectState: "idle",
          missingProjectInfo: null,
          searchQuery: "",
          filterMotion: null,
          isDirty: false,
          isHydrating: false,
          isSaving: false,
          history: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false,
          storyMemory: null,
        });
      },

      // ── UI States ─────────────────────────────────────────────────────────
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      setIsEpisodeCollapsed: (v) => set({ isEpisodeCollapsed: v }),
    }),
    {
      name: "sonikoma-active-project-store",
      // Use quota-safe localStorage wrapper to prevent silent data loss
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeProjectData: state.activeProjectData
          ? {
              ...state.activeProjectData,
              scrapedImages: (
                state.activeProjectData.scrapedImages ?? []
              ).slice(0, 200),
            }
          : null,
        selectedPanelIndex: state.selectedPanelIndex,
        projectState: state.activeProjectData ? "active" : "idle",
        missingProjectInfo: state.missingProjectInfo,
        isEpisodeCollapsed: state.isEpisodeCollapsed,
        storyMemory: state.storyMemory,
        searchQuery: state.searchQuery,
        filterMotion: state.filterMotion,
        lastSavedAt: state.lastSavedAt,
        isDirty: state.isDirty,
      }),
      merge: (persisted, current) => {
        const merged = {
          ...current,
          ...(persisted as Partial<ProjectStoreState>),
        } as ProjectStoreState;

        if (merged.activeProjectData && merged.activeProjectId) {
          merged.projectState = "active";
        }

        merged.isHydrating = false;
        return merged;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.activeProjectData && state.activeProjectId) {
          state.projectState = "active";
          state.isHydrating = false;
          setActiveProjectSession(
            state.activeProjectId,
            state.activeProjectData.project.job_id ?? null
          );
          writeProjectSnapshot(state.activeProjectData);
        }
      },
    }
  )
);

export default useProjectStore;

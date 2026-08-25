/**
 * frontend/src/shared/hooks/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central barrel file exporting all shared frontend React hooks.
 * Grouped logically into Core, Studio, Workflow, and System Utilities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── 1. Application Core & Navigation ─────────────────────────────────────────
export * from "./useAppState";
export * from "./useAppLogic";
export * from "./useAppRouter";
export * from "./useAppAuth";
export * from "./useAppNotifications";
export * from "./useAppLogs";

// ── 2. Studio Canvas & Storyboard Editors ─────────────────────────────────────
export * from "./useAppAutoCrop";
export * from "./useAppBubbleCleaner";
export * from "./useAppEditorSettings";
export * from "./useAppScraperState";
export * from "./usePlaybackEngine";
export * from "./useDialogueSync";
export * from "./useBulkOperations";
export * from "./useSandboxLogic";

// ── 3. Pipeline & State Synchronization ───────────────────────────────────────
export * from "./useProjectStore";
export * from "./usePipelineActions";
export * from "./useAutoSave";
export * from "./useConfigHistory";
export * from "./usePersistedState";

// ── 4. System, Theme & User Utilities ─────────────────────────────────────────
export * from "./useGlobalShortcuts";
export * from "./useBackendHealth";
export * from "./useCredits";
export * from "./useThemeMode";

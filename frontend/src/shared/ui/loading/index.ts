/**
 * Shared Loading State Components
 *
 * Barrel export for all reusable loading/processing overlays and screens.
 * Import from `@/shared/ui/loading`:
 *
 * @example
 * import {
 *   ExtractionSkeletonCard,
 *   ImportImagesLoadingOverlay,
 *   NarrativeGeneratingBanner,
 *   PanelProcessingOverlay,
 *   PanelAnalyzingOverlay,
 *   AutoCropLoadingOverlay,
 * } from "@/shared/ui/loading";
 */

export { ExtractionSkeletonCard } from "./ExtractionSkeletonCard";
export { ImportImagesLoadingOverlay } from "./ImportImagesLoadingOverlay";
export { NarrativeGeneratingBanner } from "./NarrativeGeneratingBanner";
export {
  PanelProcessingOverlay,
  getPanelProcessingLabel,
  type ProcessingMode,
} from "./PanelProcessingOverlay";
export { PanelAnalyzingOverlay } from "./PanelAnalyzingOverlay";
export { default as AutoCropLoadingOverlay } from "./AutoCropLoadingOverlay";

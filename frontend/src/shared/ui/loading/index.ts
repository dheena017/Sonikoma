/**
 * Shared Loading State Components
 *
 * Barrel export for all reusable loading/processing overlays.
 * Import from here instead of individual files:
 *
 * @example
 * import { ExtractionSkeletonCard, PanelProcessingOverlay, PanelAnalyzingOverlay } from "@/shared/ui/loading";
 */

export { ExtractionSkeletonCard } from "./ExtractionSkeletonCard";
export {
  PanelProcessingOverlay,
  getPanelProcessingLabel,
  type ProcessingMode,
} from "./PanelProcessingOverlay";
export { PanelAnalyzingOverlay } from "./PanelAnalyzingOverlay";

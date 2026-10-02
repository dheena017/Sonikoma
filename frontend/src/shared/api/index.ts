// Master barrel: re-exports all shared API infrastructure AND
// every feature-domain endpoint so legacy @/api imports resolve.
export * from "./client/fetchWithInterceptor";
export * from "./client/request";
export * from "./types";
export * from "./hooks/useBackendHealth";
// Feature domain endpoints (re-exported for backward compatibility)
export * from "@/features/auth/api/auth";
export * from "@/features/admin/api/admin";
export * from "@/features/admin/api/analytics";
export * from "@/features/platform/projects/api/projects";
export * from "@/features/platform/jobs/api/jobs";
export * from "@/features/platform/terminal/api/system";
export * from "@/features/platform/scraper/api/scraper";
export * from "@/features/intelligence/core/api/ai";
export * from "@/features/intelligence/series/api/aiSeries";
export * from "@/features/intelligence/skills/api/skills";
export * from "@/features/image-editor/canvas/api/image";
export * from "@/features/image-editor/canvas/api/crop";
export * from "@/features/image-editor/layers/api/panels";
export * from "@/features/creative/youtube/api/export";
export * from "@/features/video-editor/video/api/video";

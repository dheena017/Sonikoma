// Export Single Canonical AI Smart Routing Drawer & Selector from AI Core
export { default as AISmartRoutingDrawer, AISmartRoutingDrawer as AIModelSelector, AISmartRoutingDrawer as NamedAIModelSelector } from "./components/AISmartRoutingDrawer";
export type { AISmartRoutingDrawerProps, AISmartRoutingDrawerProps as AIModelSelectorProps } from "./components/AISmartRoutingDrawer";

// Export HeaderCreditsPopover
export { default as HeaderCreditsPopover } from "./components/HeaderCreditsPopover";
export type { HeaderCreditsPopoverProps } from "./components/HeaderCreditsPopover";

// Export Hooks & Stores
export * from "./hooks/useAIModels";
export * from "./hooks/useAutoAnalysis";
export * from "./hooks/useAIModelStore";

// Export Components
export * from "./components";

// ── Standardized Clean AI Core Pages ───────────────────────────────────────
export { default as AICoreOverviewPage } from "./pages/AICoreOverviewPage";
export { default as AIAPIKeysPage } from "./pages/AIAPIKeysPage";
export { default as AIRateLimitsPage } from "./pages/AIRateLimitsPage";
export { default as AIUsageAnalyticsPage } from "./pages/AIUsageAnalyticsPage";
export { default as AIRoutingPage } from "./pages/AIRoutingPage";
export { default as AICreditWalletPage } from "./pages/AICreditWalletPage";

// ── Backward Compatible Aliases ─────────────────────────────────────────────
export { default as AICoreDashboardPage } from "./pages/AICoreOverviewPage";
export { default as AIAPIManagementPage } from "./pages/AIAPIKeysPage";
export { default as AISafetyQuotasPage } from "./pages/AIRateLimitsPage";
export { default as AITokenModelsPage } from "./pages/AIRateLimitsPage";
export { default as AIAnalyticsPage } from "./pages/AIUsageAnalyticsPage";
export { default as AIChartsPage } from "./pages/AIUsageAnalyticsPage";
export { default as AIModelsRoutingPage } from "./pages/AIRoutingPage";
export { default as AIBillingPage } from "./pages/AICreditWalletPage";

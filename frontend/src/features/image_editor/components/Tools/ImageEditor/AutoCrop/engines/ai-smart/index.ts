import { AISmartSettingsPanel } from "./AISmartSettingsPanel";
export * from "./AISmartSettingsPanel";

export const aiSmartEngine = {
  id: "ai-smart",
  name: "AI Smart",
  description: "AI-powered crop detection",
  capabilities: ["ai_detection"],
  settingsComponent: AISmartSettingsPanel,
  defaultSettings: {},
};

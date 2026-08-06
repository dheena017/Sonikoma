import { OpenCVSettingsPanel } from "./OpenCVSettingsPanel";
export * from "./OpenCVSettingsPanel";

export const opencvEngine = {
  id: "opencv",
  name: "OpenCV",
  description: "Computer vision border detection",
  capabilities: ["border_detection"],
  settingsComponent: OpenCVSettingsPanel,
  defaultSettings: {},
};

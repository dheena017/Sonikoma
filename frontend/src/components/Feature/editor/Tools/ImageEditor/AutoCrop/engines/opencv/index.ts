import { AutoCropEngine } from '../../services/EngineRegistry';
import { OpenCVSettingsPanel } from './OpenCVSettingsPanel';
import { defaultAutoCropSettings } from '../../contexts/AutoCropContext';

export const opencvEngine: AutoCropEngine = {
  id: 'opencv',
  name: 'OpenCV Only',
  description: 'Local Python edge and contour finder. Uses Canny filtering for fast page gutter cutting. Offline capable, fast, and completely reliable.',
  capabilities: ['Fast', 'Offline', 'No API Cost', 'Recommended', 'Default'],
  settingsComponent: OpenCVSettingsPanel,
  defaultSettings: defaultAutoCropSettings.opencv,
};

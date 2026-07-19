import { AutoCropEngine } from '../../services/EngineRegistry';
import { AISmartSettingsPanel } from './AISmartSettingsPanel';
import { defaultAutoCropSettings } from '../../contexts/AutoCropContext';

export const aiSmartEngine: AutoCropEngine = {
  id: 'aiSmart',
  name: 'Smart Scanner',
  description: 'Vision LLM segmentation. Understands panel layouts semantically, ignoring overlapping speech balloons, background splash lines, and complex gutters.',
  capabilities: ['AI Detection', 'Better Accuracy', 'OCR Support', 'Internet Required', 'API Dependent'],
  settingsComponent: AISmartSettingsPanel,
  defaultSettings: defaultAutoCropSettings.aiSmart,
};

import { useAutoCrop } from '../contexts/AutoCropContext';
import { AISmartSettings } from '../types';

export function useAISmart() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const aiSmartSettings = settings.aiSmart;
  const updateAISmartSettings = (newSettings: Partial<AISmartSettings>) => {
    updateEngineSettings('aiSmart', newSettings);
  };
  return { settings: aiSmartSettings, updateSettings: updateAISmartSettings };
}

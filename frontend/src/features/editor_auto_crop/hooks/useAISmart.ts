import { useAutoCrop } from '@/features/editor_auto_crop/contexts/AutoCropContext';
import { AISmartSettings } from '@/features/editor_auto_crop/types';

export function useAISmart() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const aiSmartSettings = settings.aiSmart;
  const updateAISmartSettings = (newSettings: Partial<AISmartSettings>) => {
    updateEngineSettings('aiSmart', newSettings);
  };
  return { settings: aiSmartSettings, updateSettings: updateAISmartSettings };
}

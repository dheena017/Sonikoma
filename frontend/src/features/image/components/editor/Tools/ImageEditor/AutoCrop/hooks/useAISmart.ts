import { useAutoCrop } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext';
import { AISmartSettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/types';

export function useAISmart() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const aiSmartSettings = settings.aiSmart;
  const updateAISmartSettings = (newSettings: Partial<AISmartSettings>) => {
    updateEngineSettings('aiSmart', newSettings);
  };
  return { settings: aiSmartSettings, updateSettings: updateAISmartSettings };
}

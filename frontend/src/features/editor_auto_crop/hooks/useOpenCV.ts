import { useAutoCrop } from '@/features/editor_auto_crop/contexts/AutoCropContext';
import { OpenCVSettings } from '@/features/editor_auto_crop/types';

export function useOpenCV() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const opencvSettings = settings.opencv;
  const updateOpenCVSettings = (newSettings: Partial<OpenCVSettings>) => {
    updateEngineSettings('opencv', newSettings);
  };
  return { settings: opencvSettings, updateSettings: updateOpenCVSettings };
}

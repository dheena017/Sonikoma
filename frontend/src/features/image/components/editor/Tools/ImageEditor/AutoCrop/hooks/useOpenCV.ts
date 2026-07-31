import { useAutoCrop } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext';
import { OpenCVSettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/types';

export function useOpenCV() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const opencvSettings = settings.opencv;
  const updateOpenCVSettings = (newSettings: Partial<OpenCVSettings>) => {
    updateEngineSettings('opencv', newSettings);
  };
  return { settings: opencvSettings, updateSettings: updateOpenCVSettings };
}

import { useAutoCrop } from '../contexts/AutoCropContext';
import { OpenCVSettings } from '../types';

export function useOpenCV() {
  const { settings, updateEngineSettings } = useAutoCrop();
  const opencvSettings = settings.opencv;
  const updateOpenCVSettings = (newSettings: Partial<OpenCVSettings>) => {
    updateEngineSettings('opencv', newSettings);
  };
  return { settings: opencvSettings, updateSettings: updateOpenCVSettings };
}

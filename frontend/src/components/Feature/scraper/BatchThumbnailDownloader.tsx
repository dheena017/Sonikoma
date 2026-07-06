import React, { useState } from 'react';
import { Download, X } from 'lucide-react';

interface Episode {
  number: string;
  title: string;
  thumbnail?: string;
  url?: string;
}

interface BatchDownloaderProps {
  episodes: Episode[];
  seriesTitle: string;
  onDownloadStart?: () => void;
  onDownloadComplete?: (count: number) => void;
}

interface DownloadProgress {
  current: number;
  total: number;
  isDownloading: boolean;
}

export const BatchThumbnailDownloader: React.FC<BatchDownloaderProps> = ({
  episodes,
  seriesTitle,
  onDownloadStart,
  onDownloadComplete,
}) => {
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    isDownloading: false,
  });

  const downloadThumbnails = async () => {
    if (!episodes || episodes.length === 0) {
      alert('No episodes to download');
      return;
    }

    try {
      // Check if JSZip is available
      if (typeof (window as any).JSZip === 'undefined') {
        const JSZip = (await import('jszip')).default;
        (window as any).JSZip = JSZip;
      }

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      const folder = zip.folder(seriesTitle.replace(/[/\\?*:|"<>]/g, '_'));

      onDownloadStart?.();
      setProgress({
        current: 0,
        total: episodes.length,
        isDownloading: true,
      });

      let downloaded = 0;

      for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];

        if (!episode.thumbnail) {
          setProgress((p) => ({
            ...p,
            current: i + 1,
          }));
          continue;
        }

        try {
          const response = await fetch(episode.thumbnail, {
            mode: 'cors',
            credentials: 'omit',
          });

          if (response.ok) {
            const blob = await response.blob();
            const ext = episode.thumbnail.includes('jpg')
              ? 'jpg'
              : episode.thumbnail.includes('png')
                ? 'png'
                : 'webp';
            const filename = `${episode.number}_${episode.title.replace(/[/\\?*:|"<>]/g, '_').substring(0, 30)}.${ext}`;

            folder?.file(filename, blob);
            downloaded++;
          }
        } catch (err) {
          console.warn(`Failed to download ${episode.number}:`, err);
        }

        setProgress((p) => ({
          ...p,
          current: i + 1,
        }));
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${seriesTitle}_thumbnails.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setProgress({
        current: 0,
        total: 0,
        isDownloading: false,
      });

      onDownloadComplete?.(downloaded);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress({
        current: 0,
        total: 0,
        isDownloading: false,
      });
    }
  };

  if (progress.isDownloading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Downloading {progress.current} of {progress.total}
            </p>
            <p className="text-xs text-gray-400">Preparing thumbnails...</p>
          </div>
          <X size={20} className="text-gray-400" />
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300"
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  const validEpisodes = episodes.filter((ep) => ep.thumbnail);

  return (
    <button
      onClick={downloadThumbnails}
      disabled={validEpisodes.length === 0}
      className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
    >
      <Download size={18} />
      Download {validEpisodes.length} Thumbnails as ZIP
    </button>
  );
};

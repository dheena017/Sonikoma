import JSZip from "jszip";
import { processWithConcurrency } from "../../../../utils/batchUtils";

export async function buildZipBlobFromUrls(
  urls: string[],
  activeFetch: typeof fetch
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder("webtoon_frames");
  if (!folder) {
    throw new Error("Unable to create ZIP folder.");
  }

  await processWithConcurrency(urls, 8, async (url, index) => {
    try {
      const response = await activeFetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();
      const filename = `webtoon_frame_${String(index + 1).padStart(
        3,
        "0"
      )}.png`;
      folder.file(filename, blob);
    } catch (err) {
      console.error(
        "[useLiveScraperZip] Failed to add image to ZIP:",
        url,
        err
      );
    }
  });

  return zip.generateAsync({ type: "blob" });
}

import JSZip from "jszip";
import { processWithConcurrency } from "@/shared/utils/batchUtils";
import { parseWebtoonUrl } from "@/shared/utils/url";
import {
  resolveDownloadNaming,
  generateMetadataText,
  generateMetadataReadme,
  makeSafeFilename,
} from "@/shared/utils/downloadNaming";

export { makeSafeFilename };

export interface ZipNamingOptions {
  seriesTitle?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  targetUrl?: string;
  sourceSite?: string;
}

export function resolveSeriesAndChapter(options?: ZipNamingOptions): {
  seriesName: string;
  chapterNum: string;
  sourceSite: string;
  formattedPrefix: string;
} {
  return resolveDownloadNaming(options);
}

export async function buildZipBlobFromUrls(
  urls: string[],
  activeFetch: typeof fetch,
  options?: ZipNamingOptions
): Promise<{ blob: Blob; zipFilename: string }> {
  const zip = new JSZip();
  const { seriesName, chapterNum, sourceSite, formattedPrefix } =
    resolveDownloadNaming(options);

  const folderName = `${formattedPrefix}_panels`;
  const folder = zip.folder(folderName) || zip;

  // Add Metadata TXT and README Markdown files into the ZIP archive
  const metadataInfo = {
    seriesTitle: options?.seriesTitle || seriesName,
    chapterNumber: options?.chapterNumber || chapterNum,
    chapterTitle: options?.chapterTitle,
    targetUrl: options?.targetUrl,
    sourceSite: options?.sourceSite || sourceSite,
    totalPanels: urls.length,
    extractedAt: new Date().toISOString(),
    panelUrls: urls,
  };

  const metadataText = generateMetadataText(metadataInfo);
  const metadataReadme = generateMetadataReadme(metadataInfo);

  folder.file("metadata.txt", metadataText);
  folder.file("README.md", metadataReadme);

  await processWithConcurrency(urls, 8, async (url, index) => {
    try {
      const response = await activeFetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();
      const imgNum = String(index + 1).padStart(3, "0");

      let ext = "png";
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
        ext = "jpg";
      } else if (contentType?.includes("webp")) {
        ext = "webp";
      }

      const filename = `${formattedPrefix}_img_${imgNum}.${ext}`;
      folder.file(filename, blob);
    } catch (err) {
      console.error(
        "[useLiveScraperZip] Failed to add image to ZIP:",
        url,
        err
      );
    }
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const zipFilename = `${folderName}.zip`;

  return { blob, zipFilename };
}


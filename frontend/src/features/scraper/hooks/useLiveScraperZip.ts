import JSZip from "jszip";
import { processWithConcurrency } from "@/utils/batchUtils";
import { parseWebtoonUrl } from "@/utils/url";

export function makeSafeFilename(name: string): string {
  if (!name) return "";
  const cleaned = name.replace(/[^\w\s-]/g, "");
  const replaced = cleaned.replace(/[-\s]+/g, "_");
  return replaced.replace(/^_+|_+$/g, "");
}

export interface ZipNamingOptions {
  seriesTitle?: string;
  chapterNumber?: string;
  targetUrl?: string;
}

export function resolveSeriesAndChapter(options?: ZipNamingOptions): {
  seriesName: string;
  chapterNum: string;
} {
  let seriesName = options?.seriesTitle?.trim() || "";
  let chapterNum = options?.chapterNumber?.trim() || "";

  if ((!seriesName || !chapterNum) && options?.targetUrl) {
    try {
      const parsed = parseWebtoonUrl(options.targetUrl);
      if (!seriesName && parsed.title) {
        seriesName = parsed.title.trim();
      }
      if (!chapterNum && parsed.chapterNumber) {
        chapterNum = parsed.chapterNumber.trim();
      }
    } catch (e) {}
  }

  const safeSeries = makeSafeFilename(seriesName) || "Webtoon";
  const safeChapter = makeSafeFilename(chapterNum) || "1";

  return { seriesName: safeSeries, chapterNum: safeChapter };
}

export async function buildZipBlobFromUrls(
  urls: string[],
  activeFetch: typeof fetch,
  options?: ZipNamingOptions
): Promise<{ blob: Blob; zipFilename: string }> {
  const zip = new JSZip();
  const { seriesName, chapterNum } = resolveSeriesAndChapter(options);

  const folderName = `${seriesName}_Ch_${chapterNum}`;
  const folder = zip.folder(folderName) || zip;

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

      const filename = `${seriesName}_Ch_${chapterNum}_img_${imgNum}.${ext}`;
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

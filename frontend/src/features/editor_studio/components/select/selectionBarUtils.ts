import * as api from "@/api";

export interface ImageEditParams {
  url: string;
  flipHorizontal?: boolean;
  rotate?: number;
  autoTrim?: boolean;
}

export async function editSelectedUrls(
  urls: string[],
  editParams: Partial<ImageEditParams>,
  fetchWithInterceptor: any,
  addNotification?: (msg: string, type: any) => void,
  progressMsg?: string,
  successMsg?: string,
  errorPrefix?: string
): Promise<Record<string, string>> {
  if (urls.length === 0 || !fetchWithInterceptor) return {};
  addNotification?.(progressMsg || "Processing images...", "info");
  const results: Record<string, string> = {};
  for (const url of urls) {
    try {
      const data = await api.submitImageEdits(fetchWithInterceptor, {
        url,
        autoTrim: false,
        ...editParams,
      });
      if (data.url) {
        results[url] = data.url;
      }
    } catch (err: any) {
      console.error(err);
      addNotification?.(`${errorPrefix || "Error"}: ${err.message}`, "error");
    }
  }
  if (Object.keys(results).length > 0) {
    addNotification?.(successMsg || "Processed successfully!", "success");
  }
  return results;
}

export function exportUrls(
  urls: { url: string; filename: string }[],
  addNotification?: (msg: string, type: any) => void
) {
  if (urls.length === 0) return;
  addNotification?.("Downloading individual assets...", "info");
  urls.forEach(({ url, filename }) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

export function copyTextToClipboard(
  text: string,
  addNotification?: (msg: string, type: any) => void,
  successMsg?: string
) {
  navigator.clipboard.writeText(text);
  addNotification?.(successMsg || "Copied to clipboard!", "success");
}

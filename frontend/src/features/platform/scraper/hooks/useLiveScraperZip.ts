import JSZip from "jszip";
import { processWithConcurrency } from "@/shared/utils/batchUtils";
import {
  resolveDownloadNaming,
  generateMetadataText,
  generateMetadataReadme,
  makeSafeFilename,
} from "@/shared/utils/downloadNaming";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";

export { makeSafeFilename };

export interface StoryboardPanelItem {
  index?: number;
  imageUrl: string;
  audioUrl?: string;
  speechText?: string;
  sfx?: string;
  visualPrompt?: string;
  duration?: number;
  motionType?: string;
  episodeLabel?: string;
  characterName?: string;
  emotion?: string;
}

export interface ZipNamingOptions {
  seriesTitle?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  targetUrl?: string;
  sourceSite?: string;
  folderName?: string;
  panelsMeta?: StoryboardPanelItem[];
  totalDuration?: number;
}

export function resolveSeriesAndChapter(options?: ZipNamingOptions): {
  seriesName: string;
  chapterNum: string;
  sourceSite: string;
  formattedPrefix: string;
} {
  return resolveDownloadNaming(options);
}

/**
 * Strips JSON artifacts, quotes, and escapes to produce clean human prose.
 */
function cleanHumanText(val?: unknown): string {
  if (val === null || val === undefined) return "";
  let text = typeof val === "string" ? val.trim() : JSON.stringify(val);
  if (!text) return "";

  // Check if text is encoded JSON
  if (
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") return cleanHumanText(parsed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => cleanHumanText(item))
          .filter(Boolean)
          .join(" ");
      }
      if (typeof parsed === "object" && parsed !== null) {
        const candidate =
          parsed.dialogue ||
          parsed.text ||
          parsed.speech ||
          parsed.speech_text ||
          parsed.prompt ||
          parsed.description ||
          parsed.visual_description ||
          parsed.narration;
        if (candidate) return cleanHumanText(candidate);
        const firstStr = Object.values(parsed).find(
          (v) => typeof v === "string"
        );
        if (firstStr) return cleanHumanText(firstStr);
      }
    } catch {
      // Not valid JSON, keep processing
    }
  }

  // Remove quotes and escape slashes
  text = text
    .replace(/^["']|["']$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\r/g, "")
    .trim();

  return text;
}

/**
 * Formats raw camera motion tags into clear director notes.
 */
function formatCameraMotion(motionType?: string, duration?: number): string {
  const durStr = duration && duration > 0 ? `${duration.toFixed(1)}s` : "";
  if (!motionType || !motionType.trim()) {
    return durStr ? `Standard Framing (${durStr})` : "Standard Framing";
  }

  const clean = motionType
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  return durStr ? `${clean} (${durStr})` : clean;
}

/**
 * Downloads or converts an image or audio URL/data-URI to a Blob.
 */
async function fetchMediaAsBlob(
  rawUrl: string,
  targetUrl?: string,
  activeFetch?: typeof fetch,
  mediaType: "image" | "audio" = "image"
): Promise<{ blob: Blob; ext: string }> {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Empty media URL");
  }

  const trimmed = rawUrl.trim();

  // 1. Data URLs: Convert base64 data to Blob directly
  if (trimmed.startsWith("data:")) {
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx !== -1) {
      const header = trimmed.substring(0, commaIdx);
      const dataStr = trimmed.substring(commaIdx + 1);
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch
        ? mimeMatch[1]
        : mediaType === "audio"
        ? "audio/mpeg"
        : "image/png";
      const isBase64 = header.includes(";base64");

      let byteCharacters: string;
      if (isBase64) {
        byteCharacters = atob(dataStr);
      } else {
        byteCharacters = decodeURIComponent(dataStr);
      }
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: mime });
      let ext = mediaType === "audio" ? "mp3" : "png";
      if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("avif")) ext = "avif";
      else if (mime.includes("wav")) ext = "wav";
      else if (mime.includes("ogg")) ext = "ogg";
      else if (mime.includes("mp3") || mime.includes("mpeg")) ext = "mp3";
      return { blob, ext };
    }
  }

  // 2. Blob URLs: Native window.fetch works for blob: URLs
  if (trimmed.startsWith("blob:")) {
    const res = await window.fetch(trimmed);
    if (!res.ok) throw new Error(`Failed to fetch blob url: ${res.status}`);
    const blob = await res.blob();
    let ext = mediaType === "audio" ? "mp3" : "png";
    if (blob.type.includes("jpeg") || blob.type.includes("jpg")) ext = "jpg";
    else if (blob.type.includes("webp")) ext = "webp";
    else if (blob.type.includes("wav")) ext = "wav";
    else if (blob.type.includes("ogg")) ext = "ogg";
    else if (blob.type.includes("mp3") || blob.type.includes("mpeg"))
      ext = "mp3";
    return { blob, ext };
  }

  // 3. HTTP / API URLs:
  const isInternal =
    trimmed.startsWith("/") ||
    trimmed.includes("/api/") ||
    (typeof window !== "undefined" && trimmed.includes(window.location.origin));

  const proxiedUrl = isInternal
    ? trimmed
    : getProxiedImageUrl(trimmed, targetUrl);

  const candidates = [proxiedUrl];
  if (!isInternal && proxiedUrl !== trimmed) {
    candidates.push(trimmed);
  }

  let lastError: any = null;
  for (const urlToFetch of candidates) {
    try {
      const fetcher = activeFetch || window.fetch;
      const response = await fetcher(urlToFetch);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (
          contentType.includes("text/html") ||
          contentType.includes("application/json")
        ) {
          throw new Error(`Expected media binary, received ${contentType}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Received empty media blob (0 bytes)");
        }

        let ext = mediaType === "audio" ? "mp3" : "png";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          ext = "jpg";
        } else if (contentType.includes("webp")) {
          ext = "webp";
        } else if (contentType.includes("avif")) {
          ext = "avif";
        } else if (contentType.includes("wav")) {
          ext = "wav";
        } else if (contentType.includes("ogg")) {
          ext = "ogg";
        } else if (contentType.includes("mp3") || contentType.includes("mpeg")) {
          ext = "mp3";
        } else {
          const clean = urlToFetch.split("?")[0].toLowerCase();
          if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) ext = "jpg";
          else if (clean.endsWith(".webp")) ext = "webp";
          else if (clean.endsWith(".wav")) ext = "wav";
          else if (clean.endsWith(".ogg")) ext = "ogg";
          else if (clean.endsWith(".mp3")) ext = "mp3";
        }
        return { blob, ext };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to load media: ${trimmed}`);
}

/**
 * Generates an elegant, 100% human-readable director screenplay/storyboard markdown document.
 * NO JSON, NO raw code syntax.
 */
function generateHumanReadableStoryboardMd(params: {
  seriesTitle?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  targetUrl?: string;
  sourceSite?: string;
  totalDuration?: number;
  panels: Array<{
    index: number;
    imageFilename: string;
    audioFilename?: string;
    dialogueText?: string;
    sfx?: string;
    visualPrompt?: string;
    duration?: number;
    motionType?: string;
    episodeLabel?: string;
    characterName?: string;
    emotion?: string;
  }>;
}): string {
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const lines: string[] = [];
  lines.push(`# 🎬 ${params.seriesTitle || "Webtoon Series"}`);
  lines.push(
    `## Chapter ${params.chapterNumber || "1"}${
      params.chapterTitle ? ` — ${params.chapterTitle}` : ""
    }`
  );
  lines.push(
    `> **Production Storyboard & Screenplay**  \n> *Exported on ${timestamp}*`
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("### 📋 Production Overview");
  lines.push("");
  lines.push("| Detail | Information |");
  lines.push("|:---|:---|");
  lines.push(`| **Series** | ${params.seriesTitle || "Untitled Series"} |`);
  lines.push(`| **Chapter / Episode** | Chapter ${params.chapterNumber || "1"} |`);
  lines.push(`| **Total Frames** | ${params.panels.length} Panels |`);
  if (params.totalDuration && params.totalDuration > 0) {
    lines.push(
      `| **Estimated Runtime** | ${params.totalDuration.toFixed(1)} seconds (~${Math.max(
        1,
        Math.round(params.totalDuration / 60)
      )} min) |`
    );
  }
  if (params.sourceSite) {
    lines.push(`| **Source Platform** | ${params.sourceSite} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 🎞️ Storyboard Sequence");
  lines.push("");

  params.panels.forEach((p) => {
    const num = String(p.index).padStart(3, "0");
    const epLabel = p.episodeLabel ? ` (${p.episodeLabel})` : "";
    lines.push(`### Panel ${p.index}${epLabel}`);
    lines.push("");
    // Render image visually in Markdown
    lines.push(`![Panel ${p.index}](./images/${p.imageFilename})`);
    lines.push("");

    const dialogue = cleanHumanText(p.dialogueText);
    const character = cleanHumanText(p.characterName);
    const emotion = cleanHumanText(p.emotion);
    const visual = cleanHumanText(p.visualPrompt);
    const sfx = cleanHumanText(p.sfx);

    // Dialogue blockquote (screenplay style)
    if (dialogue) {
      if (character) {
        lines.push(
          `> **"${dialogue}"**  \n> — **${character}**${
            emotion ? ` *(${emotion})*` : ""
          }`
        );
      } else {
        lines.push(`> **"${dialogue}"**`);
      }
      lines.push("");
    } else {
      lines.push(`> *(Visual action shot — no dialogue)*`);
      lines.push("");
    }

    // Panel Details
    if (visual) {
      lines.push(`* **Scene Description:** ${visual}`);
    }
    if (sfx) {
      lines.push(`* **Sound Effects (SFX):** *[${sfx}]*`);
    }
    lines.push(
      `* **Camera Motion:** ${formatCameraMotion(p.motionType, p.duration)}`
    );
    if (p.audioFilename) {
      lines.push(
        `* **Voice Audio:** [🔊 Play Audio Clip](./audio/${p.audioFilename})`
      );
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  });

  lines.push(
    "*Generated by [Sonikoma AI Webtoon Studio](https://sonikoma.ai)*"
  );
  return lines.join("\n");
}

export async function buildZipBlobFromUrls(
  items: (string | StoryboardPanelItem)[],
  activeFetch: typeof fetch,
  options?: ZipNamingOptions
): Promise<{ blob: Blob; zipFilename: string }> {
  if (!items || items.length === 0) {
    throw new Error("No items provided to build ZIP archive.");
  }

  // Normalize into array of StoryboardPanelItem
  const normalizedPanels: StoryboardPanelItem[] = items.map((item, idx) => {
    if (typeof item === "string") {
      const meta = options?.panelsMeta?.[idx];
      return {
        index: idx + 1,
        imageUrl: item,
        audioUrl: meta?.audioUrl,
        speechText: meta?.speechText,
        sfx: meta?.sfx,
        visualPrompt: meta?.visualPrompt,
        duration: meta?.duration,
        motionType: meta?.motionType,
        episodeLabel: meta?.episodeLabel,
        characterName: meta?.characterName,
        emotion: meta?.emotion,
      };
    }
    return {
      index: item.index ?? idx + 1,
      imageUrl: item.imageUrl,
      audioUrl: item.audioUrl,
      speechText: item.speechText,
      sfx: item.sfx,
      visualPrompt: item.visualPrompt,
      duration: item.duration,
      motionType: item.motionType,
      episodeLabel: item.episodeLabel,
      characterName: item.characterName,
      emotion: item.emotion,
    };
  });

  const zip = new JSZip();
  const { seriesName, chapterNum, sourceSite, formattedPrefix } =
    resolveDownloadNaming(options);

  const folderName = options?.folderName || `${formattedPrefix}_panels`;
  const root = zip.folder(folderName) || zip;

  // Subfolders: images/ and audio/
  const imagesFolder = root.folder("images");
  const audioFolder = root.folder("audio");

  const imageUrls = normalizedPanels.map((p) => p.imageUrl);

  // Metadata TXT and README Markdown files
  const metadataInfo = {
    seriesTitle: options?.seriesTitle || seriesName,
    chapterNumber: options?.chapterNumber || chapterNum,
    chapterTitle: options?.chapterTitle,
    targetUrl: options?.targetUrl,
    sourceSite: options?.sourceSite || sourceSite,
    totalPanels: normalizedPanels.length,
    extractedAt: new Date().toISOString(),
    panelUrls: imageUrls,
  };

  root.file("metadata.txt", generateMetadataText(metadataInfo));
  root.file("README.md", generateMetadataReadme(metadataInfo));

  let successImageCount = 0;
  const markdownPanels: Array<{
    index: number;
    imageFilename: string;
    audioFilename?: string;
    dialogueText?: string;
    sfx?: string;
    visualPrompt?: string;
    duration?: number;
    motionType?: string;
    episodeLabel?: string;
    characterName?: string;
    emotion?: string;
  }> = [];

  // Download images concurrently into images/
  await processWithConcurrency(normalizedPanels, 6, async (panel, index) => {
    const numStr = String(index + 1).padStart(3, "0");
    let imageFilename = `panel_${numStr}.png`;
    try {
      const { blob, ext } = await fetchMediaAsBlob(
        panel.imageUrl,
        options?.targetUrl,
        activeFetch,
        "image"
      );
      imageFilename = `panel_${numStr}.${ext}`;
      imagesFolder?.file(imageFilename, blob);
      successImageCount++;
    } catch (err) {
      console.error(
        `[buildZipBlobFromUrls] Failed to download image #${index + 1}:`,
        panel.imageUrl,
        err
      );
    }

    let audioFilename: string | undefined = undefined;
    if (panel.audioUrl && panel.audioUrl.trim()) {
      try {
        const { blob: audioBlob, ext: audioExt } = await fetchMediaAsBlob(
          panel.audioUrl,
          options?.targetUrl,
          activeFetch,
          "audio"
        );
        audioFilename = `panel_${numStr}_audio.${audioExt}`;
        audioFolder?.file(audioFilename, audioBlob);
      } catch (err) {
        console.warn(
          `[buildZipBlobFromUrls] Audio download failed for panel #${index + 1}:`,
          panel.audioUrl,
          err
        );
      }
    }

    markdownPanels[index] = {
      index: index + 1,
      imageFilename,
      audioFilename,
      dialogueText: panel.speechText,
      sfx: panel.sfx,
      visualPrompt: panel.visualPrompt,
      duration: panel.duration,
      motionType: panel.motionType,
      episodeLabel: panel.episodeLabel,
      characterName: panel.characterName,
      emotion: panel.emotion,
    };
  });

  if (successImageCount === 0) {
    throw new Error(
      `Failed to download any images for the ZIP archive (0 of ${normalizedPanels.length} images succeeded).`
    );
  }

  // Calculate total duration
  const totalDuration =
    options?.totalDuration ||
    normalizedPanels.reduce((acc, p) => acc + (Number(p.duration) || 0), 0);

  // Generate clean, human-readable STORYBOARD.md (No JSON!)
  const storyboardMd = generateHumanReadableStoryboardMd({
    seriesTitle: options?.seriesTitle || seriesName,
    chapterNumber: options?.chapterNumber || chapterNum,
    chapterTitle: options?.chapterTitle,
    targetUrl: options?.targetUrl,
    sourceSite: options?.sourceSite || sourceSite,
    totalDuration,
    panels: markdownPanels.filter(Boolean),
  });

  root.file("STORYBOARD.md", storyboardMd);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const zipFilename = `${folderName}.zip`;

  return { blob, zipFilename };
}

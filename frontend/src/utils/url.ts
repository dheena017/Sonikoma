// Extracts the first valid URL if the pasted string contains duplicate or concatenated links.
export function extractWebtoonUrl(urlStr: string): string {
  if (!urlStr) return "";
  const trimmed = urlStr.trim();
  const duplicateAware = trimmed.match(/https?:\/\/(?:[^\s"']*?)(?=https?:\/\/|$)/i);
  return duplicateAware ? duplicateAware[0] : trimmed;
}

// Removes any webtoons language/region code (like en, fr, es, th, id, zh-hans etc.) from the URL path to keep it region-free
export function stripRegionFromUrl(urlStr: string): string {
  if (!urlStr) return "";
  let workingUrl = extractWebtoonUrl(urlStr);
  if (workingUrl && !/^https?:\/\//i.test(workingUrl)) {
    workingUrl = "https://" + workingUrl;
  }
  try {
    const urlObj = new URL(workingUrl);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const rxRegion = /^[a-z]{2}(-[a-z]{2,4})?$/i;
      if (rxRegion.test(parts[0])) {
        parts.shift(); // discard language/region prefix
        urlObj.pathname = '/' + parts.join('/');
      }
    }
    // Return with original prefix style if user didn't enter https yet
    let result = urlObj.toString();
    if (!urlStr.trim().startsWith("http://") && !urlStr.trim().startsWith("https://")) {
      result = result.replace(/^https?:\/\//i, "");
    }
    return result;
  } catch {
    return urlStr;
  }
}

// Robust path parser for dynamic Webtoon URLs to extract Title, Genre, and Chapter without any hardcoding
export function parseWebtoonUrl(urlStr: string) {
  try {
    const cleanedUrl = stripRegionFromUrl(urlStr);
    const urlObj = new URL(cleanedUrl.startsWith("http") ? cleanedUrl : "https://" + cleanedUrl);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    
    let genre = "general";
    let title = "Webtoon Comic";
    let episode = "Intro Chapter";

    if (parts.length >= 2) {
      genre = parts[0] || "general";
      title = parts[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (parts[2] && parts[2] !== 'viewer') {
        episode = parts[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    } else if (parts.length === 1) {
      title = parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return { genre, title, episode };
  } catch {
    return { genre: "general", title: "Custom Storyboard", episode: "Dynamic Chapter" };
  }
}

import type { FaqItem, SampleComic, DetectedPlatform } from "../types";

export const SAMPLE_URLS: SampleComic[] = [
  {
    name: "Solo Leveling",
    url: "https://mangadex.org/title/solo-leveling-chapter-1",
    tag: "Manhwa / Action",
    icon: "⚡",
    thumbnail: "/demo-action-hero.jpg",
    platform: "MangaDex",
  },
  {
    name: "Lore Olympus",
    url: "https://webtoons.com/episode/lore-olympus-ep-1",
    tag: "Webtoon / Romance",
    icon: "🌸",
    thumbnail: "/demo-romance.jpg",
    platform: "Webtoon",
  },
  {
    name: "Omniscient Reader",
    url: "https://mangadex.org/title/omniscient-reader-ch-1",
    tag: "Fantasy / System",
    icon: "📖",
    thumbnail: "/demo-monarch.jpg",
    platform: "MangaDex",
  },
  {
    name: "Tower of God",
    url: "https://webtoons.com/episode/tower-of-god-ch-1",
    tag: "Action / Shonen",
    icon: "🗡️",
    thumbnail: "/demo-cyberpunk.jpg",
    platform: "Webtoon",
  },
];

export const FAQS: FaqItem[] = [
  {
    q: "How does the comic-to-video conversion work?",
    a: "Sonikoma reads comic pages, automatically slices each panel using computer vision, cleans speech bubble text via AI inpainting, detects character emotions, generates synchronized voice audio, and adds cinematic 2.5D camera motion to produce finished vertical videos.",
  },
  {
    q: "What comic platforms are supported for chapter importing?",
    a: "Sonikoma natively supports scraping from MangaDex, Webtoon, and Tapas by pasting the chapter URL. You can also manually upload your own comic images, CBZ archives, or PDF chapters.",
  },
  {
    q: "Can I choose different voices for different characters?",
    a: "Yes. You can assign different male, female, or narrator voices to different characters, choose background music moods, and adjust camera speed.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The Free plan gives you 3 video exports every month with all core features so you can test it without entering a credit card.",
  },
  {
    q: "What video resolutions and aspect ratios are supported?",
    a: "Sonikoma supports 9:16 vertical (optimized for TikTok, Shorts, and Reels), 1:1 square for feed posts, and 16:9 widescreen. You can export in 720p HD, 1080p Full HD, and 4K 60fps Ultra HD.",
  },
  {
    q: "Can I monetize or use the generated videos commercially?",
    a: "Yes! Videos exported on the Pro and Studio plans include a full commercial license for YouTube monetization, TikTok Creator Rewards, and commercial client production, as long as you own or hold the rights to adapt the source artwork.",
  },
  {
    q: "Can I use my own comic images?",
    a: "Yes. You can start with a supported chapter link or upload your own comic images (PNG, JPEG, WebP, CBZ, and PDF) to begin building a video.",
  },
  {
    q: "How accurate is speech bubble erasing on complex manga art?",
    a: "The Gemini Vision AI combined with OpenCV neural inpainting achieves 99.8% precision, seamlessly reconstructing underlying textures, character hair, line art, and screen tones without visible blur.",
  },
  {
    q: "Can I adjust the result before exporting?",
    a: "Yes. Review your panels, dialogue, voices, and pacing in the studio so the final video feels like your story.",
  },
  {
    q: "Can I make a video from any comic I find online?",
    a: "Only use material you created or have permission to adapt and share. Copyright and platform rules vary, so you are responsible for confirming that your use is authorized.",
  },
];

export function getDetectedPlatform(url: string): DetectedPlatform | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("mangadex.org") || lower.includes("mangadex")) {
    return {
      name: "MangaDex",
      tagClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
  }
  if (lower.includes("webtoons.com") || lower.includes("webtoon")) {
    return {
      name: "Webtoon",
      tagClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
  }
  if (lower.includes("tapas.io") || lower.includes("tapas")) {
    return {
      name: "Tapas",
      tagClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return {
      name: "Link Ready",
      tagClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
  }
  return null;
}

import React, { useState } from "react";
import {
  Play,
  Scissors,
  Zap,
  Globe,
  ChevronDown,
  ChevronUp,
  Languages,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Loader2,
  Clipboard,
  ClipboardCheck,
  Link2,
  Film,
  Volume2,
  Check,
  UploadCloud,
} from "lucide-react";
import { useLandingPage } from "@/features/app_landing/hooks";
import {
  PricingCard,
  LandingFooter,
  SlicingBefore,
  SlicingAfter,
  BubblesBefore,
  BubblesAfter,
  TranslationBefore,
  TranslationAfter,
} from "@/features/app_landing/components";
import { LandingAnimeScene } from "@/features/app_landing/components/LandingAnimeScene";
import { SonikomaLogo } from "@/shared/ui/branding";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
}

const SAMPLE_URLS = [
  {
    name: "Solo Leveling",
    url: "https://mangadex.org/title/solo-leveling-chapter-1",
    tag: "Manhwa / Action",
    icon: "⚡",
    platform: "MangaDex",
    glowColor: "hover:border-neutral-700 hover:shadow-blue-500/20 active:border-blue-400",
  },
  {
    name: "Lore Olympus",
    url: "https://www.webtoons.com/en/romance/lore-olympus/episode-1",
    tag: "Romance / Drama",
    icon: "🌸",
    platform: "Webtoon",
    glowColor: "hover:border-pink-500 hover:shadow-pink-500/20 active:border-pink-400",
  },
  {
    name: "Omniscient Reader",
    url: "https://www.webtoons.com/en/action/omniscient-reader/episode-1",
    tag: "Action / Fantasy",
    icon: "🗡️",
    platform: "Webtoon",
    glowColor: "hover:border-emerald-500 hover:shadow-emerald-500/20 active:border-emerald-400",
  },
  {
    name: "Tower of God",
    url: "https://www.webtoons.com/en/fantasy/tower-of-god/episode-1",
    tag: "Adventure",
    icon: "🏰",
    platform: "Webtoon",
    glowColor: "hover:border-amber-500 hover:shadow-amber-500/20 active:border-amber-400",
  },
];

const FAQS = [
  {
    q: "How does it turn comics into videos?",
    a: "You paste a chapter link or upload images. The system automatically cuts the individual comic panels, cleans speech bubbles, adds realistic character voice narration, and adds smooth camera pans to generate a vertical video for TikTok, YouTube Shorts, and Instagram Reels.",
  },
  {
    q: "Can I use foreign comics in Korean or Japanese?",
    a: "Yes. The AI automatically detects text in Korean, Japanese, Chinese, or other languages, erases the original bubbles, and translates them into clean English with voiced character lines.",
  },
  {
    q: "Can I choose different voices for different characters?",
    a: "Yes. You can assign different male, female, or narrator voices to different characters, choose background music moods, and adjust camera speed.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The Free plan gives you 3 video exports every month with all core features so you can test it without entering a credit card.",
  },
];

export default function LandingPage({
  onGetStarted,
  onLogin,
  themeMode = "dark",
}: LandingPageProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pasteCopied, setPasteCopied] = useState(false);
  const [inputTab, setInputTab] = useState<"url" | "upload">("url");

  const {
    demoTab,
    setDemoTab,
    landingUrl,
    setLandingUrl,
    billingCycle,
    setBillingCycle,
    openFaq,
    toggleFaq,
  } = useLandingPage();

  const isLight = themeMode === "light";

  const handleAction = (callback: () => void) => {
    if (landingUrl.trim()) {
      try {
        sessionStorage.setItem("pending_comic_url", landingUrl.trim());
      } catch {}
    }
    setIsNavigating(true);
    callback();
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setLandingUrl(text.trim());
          setPasteCopied(true);
          setTimeout(() => setPasteCopied(false), 2000);
        }
      }
    } catch {
      // Fallback if permission blocked
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAction(onGetStarted);
    }
  };

  const getDetectedPlatform = (url: string) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes("mangadex.org") || lower.includes("mangadex")) {
      return { name: "MangaDex", tagClass: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
    }
    if (lower.includes("webtoons.com") || lower.includes("webtoon")) {
      return { name: "Webtoon", tagClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    }
    if (lower.includes("tapas.io") || lower.includes("tapas")) {
      return { name: "Tapas", tagClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    }
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      return { name: "Link Ready", tagClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    }
    return null;
  };

  const detectedPlatform = getDetectedPlatform(landingUrl);

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-300 selection:bg-blue-500 selection:text-white ${
        isLight
          ? "bg-[#f8fafc] text-slate-900"
          : "bg-[#0a0b0e] text-neutral-100"
      }`}
    >
      {/* NAVIGATION */}
      <nav
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 flex-shrink-0 ${
          isLight
            ? "bg-white/95 border-slate-200/90 shadow-xs"
            : "bg-[#0d0e12]/95 border-[#2F2F2F]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <SonikomaLogo
            size="md"
            showSubtitle={true}
            subtitleText="Comic to Video AI"
            onClick={() => {
              const el = document.getElementById("landing-scroll-area");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          <div className="hidden md:flex items-center gap-1.5">
            {[
              { label: "How It Works", target: "how-it-works", tip: "Learn how Sonikoma works in 3 steps" },
              { label: "Live Demo", target: "demo-showcase", tip: "Interactive transformation preview" },
              { label: "Pricing", target: "pricing", tip: "View pricing plans & credits" },
              { label: "FAQ", target: "faq", tip: "Frequently asked questions" },
            ].map((link) => (
              <Tooltip key={link.target} text={link.tip} placement="bottom">
                <button
                  onClick={() => {
                    document
                      .getElementById(link.target)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                    isLight
                      ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </button>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Tooltip text="Log in to your Sonikoma account" placement="bottom">
              <button
                disabled={isNavigating}
                onClick={() => handleAction(onLogin)}
                className={`hidden sm:inline-flex px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer rounded-xl select-none focus:outline-none ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Sign In
              </button>
            </Tooltip>

            <Tooltip text="Start creating comic videos for free" placement="bottom">
              <button
                disabled={isNavigating}
                onClick={() => handleAction(onGetStarted)}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-blue-500/20 active:scale-95 cursor-pointer select-none focus:outline-none flex items-center gap-2"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Get Started Free</span>
                )}
              </button>
            </Tooltip>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  : "bg-[#181818] border-[#2F2F2F] text-neutral-300 hover:bg-[#222]"
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden border-t px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isLight
                ? "bg-white border-slate-200 text-slate-900 shadow-lg"
                : "bg-[#0d0e12] border-[#2F2F2F] text-white shadow-2xl"
            }`}
          >
            {[
              { label: "How It Works", target: "how-it-works" },
              { label: "Live Demo", target: "demo-showcase" },
              { label: "Pricing", target: "pricing" },
              { label: "FAQ", target: "faq" },
            ].map((link) => (
              <button
                key={link.target}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  document
                    .getElementById(link.target)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-slate-100 text-slate-700"
                    : "hover:bg-white/5 text-neutral-300"
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="pt-2 border-t border-[#2F2F2F]/30 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogin();
                }}
                className={`w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                    : "border-[#2F2F2F] bg-[#181818] text-white hover:bg-[#222]"
                }`}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* SCROLLABLE CONTENT AREA */}
      <div
        id="landing-scroll-area"
        className={`custom-scrollbar flex-1 overflow-y-auto relative ${
          isLight ? "bg-[#f8fafc]" : "bg-[#0a0b0e]"
        }`}
      >
        {/* HERO SECTION */}
        <section className="relative pt-14 sm:pt-18 pb-24 sm:pb-32 px-4 sm:px-6 overflow-hidden">
          <LandingAnimeScene themeMode={themeMode} />

          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
            {/* Top Pill Tag */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all shadow-sm ${
                isLight
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI-Powered Comic Video Studio</span>
            </div>

            {/* Main Headline */}
            <h1
              className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Turn Any Comic Into <br />
              <span
                className={`text-transparent bg-clip-text bg-gradient-to-r ${
                  isLight
                    ? "from-blue-700 via-indigo-600 to-slate-900"
                    : "from-blue-400 via-indigo-400 to-cyan-300"
                }`}
              >
                Voiced Vertical Videos
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className={`text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed transition-colors ${
                isLight ? "text-slate-600" : "text-neutral-300"
              }`}
            >
              Paste any chapter link or drop images. Sonikoma auto-cuts panels, removes speech bubbles, generates dynamic AI voice acting, and renders viral TikTok & Shorts in seconds.
            </p>

            {/* HERO COMPONENT: ADVANCED OMNIBAR CARD */}
            <div className="pt-2 sm:pt-4 max-w-3xl mx-auto w-full text-left relative">
              {/* Subtle ambient cyber glow backdrop */}
              <div
                className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-xl opacity-75 pointer-events-none"
                aria-hidden="true"
              />

              <div
                className={`relative rounded-[28px] border transition-all duration-300 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4 ${
                  isLight
                    ? "bg-white/95 border-slate-200/90 shadow-slate-200/50"
                    : "bg-[#121318]/95 border-white/10 shadow-black/80"
                }`}
              >
                {/* Mode Selector Tabs (URL vs Upload) */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setInputTab("url")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        inputTab === "url"
                          ? isLight
                            ? "bg-white text-blue-700 shadow-xs"
                            : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Chapter Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(onGetStarted)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        inputTab === "upload"
                          ? isLight
                            ? "bg-white text-blue-700 shadow-xs"
                            : "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Files</span>
                    </button>
                  </div>

                  <span
                    className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      isLight ? "text-slate-500" : "text-neutral-400"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Supports MangaDex, Webtoon, Tapas
                  </span>
                </div>

                {/* Main Input Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                  <div
                    className={`flex items-center gap-2.5 flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border transition-all duration-200 ${
                      isLight
                        ? "bg-slate-50/90 border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-500/15"
                        : "bg-[#181a22] border-white/10 hover:border-white/20 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/25"
                    }`}
                  >
                    {/* Globe / Link Icon */}
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isLight
                          ? "bg-blue-50 text-blue-600"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>

                    {/* Text Input */}
                    <input
                      type="url"
                      placeholder="Paste comic link (e.g. MangaDex, Webtoon chapter)..."
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0 font-medium ${
                        isLight
                          ? "text-slate-900 placeholder:text-slate-400"
                          : "text-white placeholder:text-neutral-500"
                      }`}
                    />

                    {/* Detected Platform Badge */}
                    {detectedPlatform && (
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 animate-in fade-in zoom-in-95 duration-200 ${detectedPlatform.tagClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {detectedPlatform.name}
                      </span>
                    )}

                    {/* Clear Button */}
                    {landingUrl && (
                      <Tooltip text="Clear input" placement="top">
                        <button
                          type="button"
                          onClick={() => setLandingUrl("")}
                          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                          aria-label="Clear URL input"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}

                    {/* Quick Clipboard Paste Button */}
                    {!landingUrl && (
                      <Tooltip text="Paste link from clipboard" placement="top">
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
                            pasteCopied
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : isLight
                              ? "bg-slate-200/80 hover:bg-slate-300 border-slate-300 text-slate-700"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white"
                          }`}
                        >
                          {pasteCopied ? (
                            <>
                              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Pasted!</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="hidden sm:inline">Paste</span>
                            </>
                          )}
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  {/* Primary CTA Action Button */}
                  <Tooltip text="Start AI panel slicing and video generation" placement="top">
                    <button
                      disabled={isNavigating}
                      onClick={() => handleAction(onGetStarted)}
                      className="group relative flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-black text-sm rounded-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer shrink-0 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:shadow-xl select-none"
                    >
                      {isNavigating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                          </div>
                          <span>Create Video</span>
                        </>
                      )}
                    </button>
                  </Tooltip>
                </div>

                {/* Sample Comics Quick-Picker */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold mr-1 flex items-center gap-1.5 ${
                      isLight ? "text-slate-700" : "text-neutral-300"
                    }`}
                  >
                    <span>Try sample comic:</span>
                  </span>

                  {SAMPLE_URLS.map((sample) => {
                    const isSelected = landingUrl === sample.url;
                    return (
                      <Tooltip
                        key={sample.name}
                        text={`Load sample: ${sample.name} (${sample.tag})`}
                        placement="bottom"
                      >
                        <button
                          type="button"
                          onClick={() => setLandingUrl(sample.url)}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? isLight
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 -translate-y-0.5"
                                : "bg-blue-600/30 text-blue-200 border-blue-400 shadow-md shadow-blue-500/20 -translate-y-0.5"
                              : isLight
                              ? "bg-slate-100 hover:bg-blue-50 border-slate-300 hover:border-neutral-700 text-slate-800 hover:text-blue-700"
                              : "bg-[#181a22] hover:bg-[#20232d] border-white/10 hover:border-neutral-700 text-neutral-300 hover:text-white"
                          } ${sample.glowColor}`}
                        >
                          <span className="text-sm leading-none">{sample.icon}</span>
                          <span>{sample.name}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-blue-300 ml-0.5" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Value Proof Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-5 text-xs font-semibold">
                <span
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                    isLight
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No credit card required</span>
                </span>

                <span
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                    isLight
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Ready in ~15 seconds</span>
                </span>

                <span
                  className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                    isLight
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                  }`}
                >
                  <Film className="w-4 h-4 text-blue-400" />
                  <span>TikTok & Shorts ready</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP PROCESS SECTION */}
        <section
          id="how-it-works"
          className={`py-24 px-6 scroll-mt-24 transition-colors relative z-10 ${
            isLight
              ? "bg-slate-100/70 border-y border-slate-200"
              : "bg-[#0d0e12] border-y border-[#2F2F2F]"
          }`}
        >
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-3">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Simple 3-Step Process
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                How It Works
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm leading-relaxed font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                No video editing skills needed. Everything is automated from chapter link to finished video.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div
                className={`p-7 rounded-[28px] border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-200 shadow-sm hover:border-neutral-700 hover:shadow-lg"
                    : "bg-[#181818] border-[#2F2F2F] hover:border-neutral-700 hover:shadow-xl hover:shadow-blue-950/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-black mb-5">
                  1
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                >
                  Import Chapter
                </h3>
                <p
                  className={`text-sm leading-relaxed font-normal ${
                    isLight ? "text-slate-700" : "text-neutral-400"
                  }`}
                >
                  Paste any chapter link from MangaDex or Webtoon, or upload your own comic image files directly.
                </p>
              </div>

              {/* Step 2 */}
              <div
                className={`p-7 rounded-[28px] border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-lg"
                    : "bg-[#181818] border-[#2F2F2F] hover:border-[#2F2F2F] hover:shadow-xl hover:shadow-indigo-950/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-[#2F2F2F] text-indigo-400 flex items-center justify-center text-xl font-black mb-5">
                  2
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                >
                  Auto-Slice & Clean
                </h3>
                <p
                  className={`text-sm leading-relaxed font-normal ${
                    isLight ? "text-slate-700" : "text-neutral-400"
                  }`}
                >
                  AI automatically isolates each comic panel, erases dialogue text bubbles, and translates foreign text into English.
                </p>
              </div>

              {/* Step 3 */}
              <div
                className={`p-7 rounded-[28px] border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-200 shadow-sm hover:border-neutral-700 hover:shadow-lg"
                    : "bg-[#181818] border-[#2F2F2F] hover:border-neutral-700 hover:shadow-xl hover:shadow-cyan-950/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-black mb-5">
                  3
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                >
                  Add Voices & Export
                </h3>
                <p
                  className={`text-sm leading-relaxed font-normal ${
                    isLight ? "text-slate-700" : "text-neutral-400"
                  }`}
                >
                  Select natural character voices and sound effects, preview camera pan animations, and download a ready-to-publish vertical MP4 video.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE DEMO SHOWCASE */}
        <section
          id="demo-showcase"
          className="pt-28 pb-24 px-6 relative overflow-hidden scroll-mt-24 z-10"
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Live Preview
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                See Before & After
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                Click each stage to see how raw comic panels are transformed.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                {
                  id: "slicing",
                  label: "1. Panel Slicing",
                  icon: <Scissors className="w-4 h-4" />,
                  tip: "Automatic comic panel bounding box detection",
                },
                {
                  id: "bubbles",
                  label: "2. Speech Bubble Removal",
                  icon: <Sparkles className="w-4 h-4" />,
                  tip: "Clean speech text bubbles with AI inpainting",
                },
                {
                  id: "translation",
                  label: "3. Auto Translation",
                  icon: <Languages className="w-4 h-4" />,
                  tip: "Detect foreign dialogues & translate into English",
                },
              ].map((t) => (
                <Tooltip key={t.id} text={t.tip} placement="top">
                  <button
                    onClick={() => setDemoTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                      demoTab === t.id
                        ? "bg-blue-600 text-white shadow-md shadow-sm -translate-y-0.5"
                        : isLight
                        ? "bg-white text-slate-800 border border-slate-300 hover:border-neutral-700 hover:text-blue-600 hover:-translate-y-0.5 shadow-2xs"
                        : "bg-[#181818] text-neutral-300 border border-[#2F2F2F] hover:border-neutral-700 hover:text-white hover:bg-[#222] hover:-translate-y-0.5 shadow-2xs"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                </Tooltip>
              ))}
            </div>

            {/* Visual Demo Showcase */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div
                  className={`rounded-[28px] border overflow-hidden shadow-xl transition-all ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-[#2F2F2F] bg-[#141414]"
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-300">
                      Before (Raw Comic Chapter)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="h-[360px]">
                    {demoTab === "slicing" && <SlicingBefore />}
                    {demoTab === "bubbles" && <BubblesBefore />}
                    {demoTab === "translation" && <TranslationBefore />}
                  </div>
                </div>
                <div
                  className={`rounded-[28px] border overflow-hidden shadow-xl transition-all ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-[#2F2F2F] bg-[#141414]"
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      After (AI Processed)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="h-[360px]">
                    {demoTab === "slicing" && <SlicingAfter />}
                    {demoTab === "bubbles" && <BubblesAfter />}
                    {demoTab === "translation" && <TranslationAfter />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section
          id="pricing"
          className={`py-24 px-6 scroll-mt-24 relative z-10 ${
            isLight
              ? "bg-slate-100/70 border-y border-slate-200"
              : "bg-[#0d0e12] border-y border-[#2F2F2F]"
          }`}
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Pricing Plans
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                Simple, Honest Pricing
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                Start free and upgrade when you are ready to create more videos.
              </p>

              {/* BILLING TOGGLE */}
              <div className="pt-3 flex items-center justify-center gap-3">
                <span
                  className={`text-sm font-bold ${
                    billingCycle === "monthly"
                      ? isLight
                        ? "text-slate-950"
                        : "text-white"
                      : isLight
                      ? "text-slate-500"
                      : "text-neutral-400"
                  }`}
                >
                  Monthly
                </span>
                <Tooltip text="Switch between monthly and yearly billing (Save 20%)" placement="top">
                  <button
                    onClick={() =>
                      setBillingCycle(
                        billingCycle === "monthly" ? "yearly" : "monthly"
                      )
                    }
                    className="w-12 h-7 rounded-full bg-blue-600/20 p-1 border border-blue-500/30 hover:border-neutral-700 relative transition-all cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-blue-600 transition-transform ${
                        billingCycle === "yearly"
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </Tooltip>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold ${
                      billingCycle === "yearly"
                        ? isLight
                          ? "text-slate-950"
                          : "text-white"
                        : isLight
                        ? "text-slate-500"
                        : "text-neutral-400"
                    }`}
                  >
                    Yearly
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    SAVE 20%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
              <PricingCard
                title="Free Starter"
                price={0}
                billingPeriod="forever"
                desc="Try out Sonikoma on your first comic videos."
                features={[
                  "3 Video Exports / month",
                  "720p HD Video Resolution",
                  "Automatic Panel Slicing",
                  "Speech Bubble Eraser",
                ]}
                excludedFeatures={[
                  "Character Voice Dubbing",
                  "Custom 4K Video Exports",
                ]}
                btnText="Start Free"
                onClick={() => handleAction(onGetStarted)}
                themeMode={themeMode}
              />

              <PricingCard
                title="Pro Creator"
                price={billingCycle === "yearly" ? 19 : 24}
                billingPeriod={
                  billingCycle === "yearly" ? "/mo (billed yearly)" : "/month"
                }
                desc="For active creators and video publishers."
                isPopular={true}
                features={[
                  "Unlimited Video Exports",
                  "1080p & 4K Ultra HD Quality",
                  "All Character Voices & SFX",
                  "Foreign Language Translation",
                  "No Watermark",
                ]}
                btnText="Upgrade to Pro"
                onClick={() => handleAction(onGetStarted)}
                themeMode={themeMode}
              />

              <PricingCard
                title="Studio"
                price={billingCycle === "yearly" ? 49 : 59}
                billingPeriod={
                  billingCycle === "yearly" ? "/mo (billed yearly)" : "/month"
                }
                desc="For studios and high-volume production teams."
                features={[
                  "Everything in Pro",
                  "Commercial Usage License",
                  "Custom Voice Cloning",
                  "Batch Chapter Importing",
                  "Fastest Rendering Priority",
                ]}
                btnText="Contact Sales"
                onClick={() => handleAction(onGetStarted)}
                themeMode={themeMode}
              />
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-24 px-6 scroll-mt-24 relative z-10">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                FAQ
              </span>
              <h2
                className={`text-3xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isLight
                        ? "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                        : "bg-[#181818] border-[#2F2F2F] hover:border-neutral-600"
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span
                        className={`font-bold text-sm sm:text-base ${
                          isLight ? "text-slate-950" : "text-white"
                        }`}
                      >
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        className={`px-5 pb-5 pt-0 text-sm leading-relaxed border-t font-normal transition-colors ${
                          isLight
                            ? "border-slate-100 text-slate-700"
                            : "border-[#2F2F2F] text-neutral-300"
                        }`}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-20 px-6 relative z-10">
          <div
            className={`max-w-4xl mx-auto rounded-[28px] p-10 md:p-14 text-center space-y-6 border transition-all ${
              isLight
                ? "bg-white border-slate-200 shadow-sm"
                : "border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] shadow-2xl"
            }`}
          >
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                  : "bg-[#181818] text-neutral-300 border border-[#2F2F2F]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Get Started Now
            </span>

            <h2
              className={`text-3xl md:text-5xl font-black leading-tight transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Start Creating Comic Videos Today
            </h2>

            <p
              className={`max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed transition-colors ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Turn static webtoon panels into voiced, animated vertical videos in just a few clicks.
            </p>

            <Tooltip text="Create your free account and export videos" placement="top">
              <button
                disabled={isNavigating}
                onClick={() => handleAction(onGetStarted)}
                className="mx-auto px-7 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/20"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Loading Studio...</span>
                  </>
                ) : (
                  <>
                    <span>Start Creating Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </section>

        {/* FOOTER */}
        <LandingFooter />
      </div>
    </div>
  );
}

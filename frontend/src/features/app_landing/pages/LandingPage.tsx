import React from "react";
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
  },
  {
    name: "Lore Olympus",
    url: "https://www.webtoons.com/en/romance/lore-olympus/episode-1",
  },
  {
    name: "Omniscient Reader",
    url: "https://www.webtoons.com/en/action/omniscient-reader/episode-1",
  },
  {
    name: "Tower of God",
    url: "https://www.webtoons.com/en/fantasy/tower-of-god/episode-1",
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
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              const el = document.getElementById("landing-scroll-area");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/50 group-hover:bg-blue-500/20 flex items-center justify-center shadow-sm transition-all duration-200">
              <img
                src={isLight ? "/logo-light.png" : "/logo-dark.png"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                }}
                className="w-6 h-6 object-contain"
                alt="Sonikoma Logo"
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-lg sm:text-xl font-black tracking-tight uppercase transition-colors ${
                  isLight ? "text-slate-950 group-hover:text-blue-600" : "text-white group-hover:text-blue-400"
                }`}
              >
                Sonikoma
              </span>
              <span
                className={`hidden sm:block text-[9px] font-mono font-bold tracking-widest uppercase -mt-1 ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Comic to Video AI
              </span>
            </div>
          </div>

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

          <div className="flex items-center gap-3">
            <Tooltip text="Log in to your Sonikoma account" placement="bottom">
              <button
                onClick={onLogin}
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
                onClick={onGetStarted}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-blue-500/20 active:scale-95 cursor-pointer select-none focus:outline-none"
              >
                Get Started Free
              </button>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* SCROLLABLE CONTENT AREA */}
      <div
        id="landing-scroll-area"
        className={`custom-scrollbar flex-1 overflow-y-auto relative ${
          isLight ? "bg-[#f8fafc]" : "bg-[#0a0b0e]"
        }`}
      >
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-28 px-6 overflow-hidden">
          <LandingAnimeScene themeMode={themeMode} />

          <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-colors mx-auto ${
                isLight
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Easy Comic to Video Maker
            </div>

            <h1
              className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Turn Any Comic Into <br />
              <span
                className={`text-transparent bg-clip-text bg-gradient-to-r ${
                  isLight
                    ? "from-blue-700 via-indigo-600 to-cyan-700"
                    : "from-blue-400 via-indigo-400 to-cyan-400"
                }`}
              >
                Voiced Vertical Videos
              </span>
            </h1>

            <p
              className={`text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed transition-colors ${
                isLight ? "text-slate-700" : "text-neutral-300"
              }`}
            >
              Paste a link or upload images. Sonikoma cuts each panel, erases speech bubbles, adds realistic character voiceovers, and generates videos ready for TikTok and Shorts.
            </p>

            {/* URL INPUT & ACTION */}
            <div className="pt-4 max-w-3xl mx-auto w-full text-left">
              <div
                className={`rounded-[28px] border p-5 sm:p-6 transition-all space-y-4 ${
                  isLight
                    ? "bg-white border-slate-200 shadow-md"
                    : "border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] shadow-2xl"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  <div
                    className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border transition-all ${
                      isLight
                        ? "bg-slate-50 border-slate-300 focus-within:border-blue-600 focus-within:bg-white"
                        : "bg-[#181818] border-[#2F2F2F] hover:border-neutral-600 focus-within:border-blue-500"
                    }`}
                  >
                    <Globe
                      className={`w-4 h-4 shrink-0 ${
                        isLight ? "text-blue-600" : "text-blue-400"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Paste comic or webtoon link (MangaDex, Webtoon)..."
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      className={`flex-1 bg-transparent outline-none text-sm min-w-0 transition-colors ${
                        isLight
                          ? "text-slate-900 placeholder:text-slate-500 font-medium"
                          : "text-white placeholder:text-neutral-500 font-medium"
                      }`}
                    />
                  </div>
                  <Tooltip text="Process this chapter and create a video" placement="top">
                    <button
                      onClick={onGetStarted}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shrink-0 shadow-md hover:shadow-blue-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Create Video
                    </button>
                  </Tooltip>
                </div>

                {/* SAMPLES */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isLight ? "text-slate-800" : "text-neutral-300"
                    }`}
                  >
                    Try sample comic:
                  </span>
                  {SAMPLE_URLS.map((sample) => (
                    <Tooltip key={sample.name} text={`Load ${sample.name} chapter URL`} placement="bottom">
                      <button
                        onClick={() => setLandingUrl(sample.url)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                          isLight
                            ? "bg-slate-100 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800 hover:-translate-y-0.5 shadow-2xs"
                            : "bg-[#181818] border-[#2F2F2F] text-neutral-300 hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300 hover:-translate-y-0.5 shadow-2xs"
                        }`}
                      >
                        {sample.name}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold">
                <span
                  className={`flex items-center gap-1.5 ${
                    isLight ? "text-slate-700" : "text-neutral-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  No credit card required
                </span>
                <span
                  className={`flex items-center gap-1.5 ${
                    isLight ? "text-slate-700" : "text-neutral-300"
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  Ready in seconds
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
                    ? "bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg"
                    : "bg-[#181818] border-[#2F2F2F] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20"
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
                    : "bg-[#181818] border-[#2F2F2F] hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-950/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black mb-5">
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
                    ? "bg-white border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-lg"
                    : "bg-[#181818] border-[#2F2F2F] hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-black mb-5">
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
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 -translate-y-0.5"
                        : isLight
                        ? "bg-white text-slate-800 border border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-0.5 shadow-2xs"
                        : "bg-[#181818] text-neutral-300 border border-[#2F2F2F] hover:border-blue-500/60 hover:text-white hover:bg-[#222] hover:-translate-y-0.5 shadow-2xs"
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
                    className="w-12 h-7 rounded-full bg-blue-600/20 p-1 border border-blue-500/30 hover:border-blue-500/60 relative transition-all cursor-pointer"
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
                onClick={onGetStarted}
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
                onClick={onGetStarted}
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
                onClick={onGetStarted}
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
                onClick={onGetStarted}
                className="mx-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/20"
              >
                Start Creating Free
                <ArrowRight className="w-4 h-4" />
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

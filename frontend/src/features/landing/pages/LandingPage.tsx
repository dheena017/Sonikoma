import React from "react";
import {
  Play,
  Sparkles,
  Scissors,
  Zap,
  Video,
  Layers,
  Globe,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  Loader2,
  Languages,
  Tv,
  Sun,
  Moon,
  Check,
  Star,
  ArrowRight,
  ShieldCheck,
  Flame,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useLandingPage, useNewsletterForm } from "@/features/landing/hooks";
import {
  FeatureCard,
  Step,
  PricingCard,
  TestimonialCard,
  LandingFooter,
  SlicingBefore,
  SlicingAfter,
  BubblesBefore,
  BubblesAfter,
  TranslationBefore,
  TranslationAfter,
  CinematicRenderDemo,
} from "@/features/landing/components";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
}

const SAMPLE_URLS = [
  { name: "Solo Leveling", url: "https://mangadex.org/title/solo-leveling-chapter-1" },
  { name: "Lore Olympus", url: "https://www.webtoons.com/en/romance/lore-olympus/episode-1" },
  { name: "Omniscient Reader", url: "https://www.webtoons.com/en/action/omniscient-reader/episode-1" },
  { name: "Tower of God", url: "https://www.webtoons.com/en/fantasy/tower-of-god/episode-1" },
];

const PLATFORMS = [
  { name: "WEBTOON", badge: "Direct Import", desc: "Official English & Global Webtoons" },
  { name: "MangaDex", badge: "Full Support", desc: "Multi-language Community Scans" },
  { name: "Naver Webtoon", badge: "Auto Translation", desc: "Raw Korean Chapters & Webtoons" },
  { name: "KakaoPage", badge: "High Res", desc: "High-resolution Vertical Comics" },
  { name: "Tapas", badge: "Fast Sync", desc: "Indie & Official Web Comics" },
];

const FAQS = [
  {
    q: "How does Sonikoma convert webtoon chapters into videos?",
    a: "Sonikoma automatically fetches chapter images from supported URLs, detects panel boundaries using AI vision models, removes speech bubbles, generates natural character voiceovers via TTS, and renders smooth motion camera pans to produce 1080p/4K vertical videos ready for TikTok, Shorts, and Reels.",
  },
  {
    q: "What webtoon & manga platforms are supported?",
    a: "Sonikoma supports direct URL importing from WEBTOON, MangaDex, Naver Webtoon, KakaoPage, Tapas, Asura Scans, and custom image file uploads (PNG, JPG, WEBP).",
  },
  {
    q: "Can I translate foreign webtoons (Korean/Japanese) into English?",
    a: "Yes! Our built-in AI Translation engine detects speech bubble text in Korean, Japanese, Chinese, or Spanish, cleans up original text bubbles, and overlay translated text or voiced character lines in English.",
  },
  {
    q: "Can I customize character voices, background music, and camera speed?",
    a: "Absolutely. You can assign distinct voice profiles (male, female, deep narrator, anime tone) to different comic characters, choose background soundtrack mood presets (Action, Mystery, Romance), and adjust zoom/pan camera speeds per panel.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes! You can start with our Free Creator plan which includes 3 video exports per month, automatic panel slicing, and standard AI voice options without entering a credit card.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Sonikoma cut my webtoon recap video editing time from 8 hours down to 15 minutes. The panel slicing and auto-camera pans look like a professional anime studio made it!",
    author: "Alex Chen",
    handle: "@MangaRecapDaily",
    rating: 5,
    role: "YouTube Creator (450K subs)",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    stats: "2.4M Shorts Views",
  },
  {
    quote: "Removing speech bubbles manually in Photoshop used to drive me crazy. Sonikoma erases bubbles seamlessly in one click while keeping character artwork intact.",
    author: "Elena Rostova",
    handle: "@ToonToks",
    rating: 5,
    role: "TikTok Content Creator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    stats: "1.1M Followers",
  },
  {
    quote: "The auto-translation feature allows me to summarize Naver Webtoons for my English audience days before official releases. Essential tool for any webtoon channel.",
    author: "Daisuke Sato",
    handle: "@AnimeNexus",
    rating: 5,
    role: "Comic Reviewer",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    stats: "890K Total Views",
  },
];

export default function LandingPage({
  onGetStarted,
  onLogin,
  themeMode = "dark",
  toggleThemeMode = () => {},
}: LandingPageProps) {
  const {
    demoTab,
    setDemoTab,
    sliderPos,
    setSliderPos,
    landingUrl,
    setLandingUrl,
    billingCycle,
    setBillingCycle,
    openFaq,
    toggleFaq,
  } = useLandingPage();

  const { email, setEmail, newsState, handleSubscribe } = useNewsletterForm();
  const isLight = themeMode === "light";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 selection:bg-purple-500 selection:text-white ${
        isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#09090b] text-neutral-100"
      }`}
    >
      {/* NAVIGATION */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          isLight
            ? "bg-white/90 border-slate-200/80 shadow-xs"
            : "bg-neutral-950/90 border-neutral-800/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={isLight ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform object-cover bg-purple-600/10 border border-purple-500/30"
              alt="Sonikoma Logo"
            />
            <div className="flex flex-col">
              <span
                className={`text-xl font-black tracking-tighter uppercase transition-colors duration-300 ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Sonikoma
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-purple-500 uppercase -mt-1">
                Comic to Video AI
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", target: "features" },
              { label: "Demo", target: "transformation-demo" },
              { label: "Platforms", target: "platforms" },
              { label: "Pricing", target: "pricing" },
              { label: "Testimonials", target: "testimonials" },
              { label: "FAQ", target: "faq" },
            ].map((link) => (
              <button
                key={link.target}
                onClick={() => {
                  document
                    .getElementById(link.target)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`text-sm font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleThemeMode}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
            <button
              onClick={onLogin}
              className={`px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                isLight
                  ? "text-slate-700 hover:text-slate-950"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-600/30 active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-600/15 via-indigo-600/10 to-transparent blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase border transition-colors ${
                isLight
                  ? "bg-purple-100/80 border-purple-200 text-purple-700"
                  : "bg-purple-950/40 border-purple-900/60 text-purple-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Make Your Comics Move
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
                isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-emerald-950/40 border-emerald-900/60 text-emerald-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              1.4M+ Panels Processed
            </div>
          </div>

          <h1
            className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] max-w-5xl mx-auto transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Turn Webtoons Into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400">
              Awesome Videos
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed transition-colors ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Paste a link, slice panels, erase speech bubbles, add AI voices, and render
            high-converting TikTok, Shorts, and Reels in seconds.
          </p>

          <div className="pt-6 max-w-4xl mx-auto w-full text-left">
            <div
              className={`rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 space-y-5 min-w-0 w-full overflow-hidden ${
                isLight
                  ? "bg-white border-slate-200 shadow-[0_20px_80px_rgba(99,102,241,0.12)]"
                  : "bg-neutral-900/90 border-neutral-800 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <div
                  className={`flex items-center gap-3 flex-1 px-4 py-3.5 rounded-2xl border transition-all ${
                    isLight
                      ? "bg-slate-50 border-slate-200 focus-within:border-purple-500 focus-within:bg-white"
                      : "bg-neutral-950 border-neutral-800 focus-within:border-purple-500"
                  }`}
                >
                  <Globe className="w-5 h-5 text-purple-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Paste Webtoon, MangaDex, or Naver chapter URL..."
                    value={landingUrl}
                    onChange={(e) => setLandingUrl(e.target.value)}
                    className={`flex-1 bg-transparent outline-none text-sm min-w-0 transition-colors ${
                      isLight
                        ? "text-slate-900 placeholder:text-slate-400"
                        : "text-white placeholder:text-neutral-500"
                    }`}
                  />
                </div>
                <button
                  onClick={onGetStarted}
                  className="flex items-center justify-center gap-2.5 px-7 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-purple-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Creating Now
                </button>
              </div>

              {/* QUICK SAMPLES */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    isLight ? "text-slate-500" : "text-neutral-400"
                  }`}
                >
                  ✨ Try sample chapter:
                </span>
                {SAMPLE_URLS.map((sample) => (
                  <button
                    key={sample.name}
                    onClick={() => setLandingUrl(sample.url)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                      isLight
                        ? "bg-slate-100 border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
                        : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:border-purple-500/50 hover:bg-purple-950/40 hover:text-purple-300"
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-6 text-xs">
              <span className={`flex items-center gap-1.5 font-medium ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                No credit card required
              </span>
              <span className={`flex items-center gap-1.5 font-medium ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}>
                <Zap className="w-4 h-4 text-amber-500" />
                Instant 4K Export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section
        className={`border-y py-12 relative overflow-hidden transition-colors ${
          isLight
            ? "border-slate-200/80 bg-slate-100/60"
            : "border-neutral-800/80 bg-neutral-900/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
              1.4M+
            </div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              Panels Processed
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">
              84K+
            </div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              Videos Exported
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
              92%
            </div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              Editing Time Saved
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
              4.9/5
            </div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              Creator Rating
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED PLATFORMS */}
      <section id="platforms" className="py-24 px-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Seamless Integration
            </span>
            <h2
              className={`text-3xl md:text-4xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Works With Your Favorite Webtoon Sites
            </h2>
            <p
              className={`max-w-xl mx-auto text-sm ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Import chapters directly from top platforms or upload custom image zip files.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.name}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 group ${
                  isLight
                    ? "bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg shadow-slate-200/40"
                    : "bg-neutral-900/50 border-white/10 hover:border-purple-500/40 hover:bg-neutral-900 shadow-xl"
                }`}
              >
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    {platform.badge}
                  </span>
                  <h3
                    className={`text-xl font-bold mt-3 group-hover:text-purple-500 transition-colors ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {platform.name}
                  </h3>
                </div>
                <p
                  className={`text-xs ${
                    isLight ? "text-slate-500" : "text-neutral-400"
                  }`}
                >
                  {platform.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section
        id="features"
        className={`py-32 px-6 scroll-mt-24 transition-colors ${
          isLight ? "bg-slate-100/50" : "bg-neutral-950/40"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Powerful Creator Tools
            </span>
            <h2
              className={`text-4xl md:text-5xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Built for Content Creators
            </h2>
            <p
              className={`max-w-xl mx-auto text-base ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              We handle the complex image processing, text erasure, TTS dubbing, and video editing so you can focus on storytelling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="1-Click Chapter Importing"
              description="Grab high-res comic panel images from any chapter link with automatic deduplication."
              color="text-blue-400"
            />
            <FeatureCard
              icon={<Scissors className="w-8 h-8" />}
              title="AI Panel Slicing Engine"
              description="Our computer vision model isolates comic panels automatically, removing margins and split borders."
              color="text-purple-400"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Inpainting Speech Eraser"
              description="Erase speech bubbles instantly with AI inpainting so background character artwork looks flawless."
              color="text-emerald-400"
            />
            <FeatureCard
              icon={<Languages className="w-8 h-8" />}
              title="Smart Translation & OCR"
              description="Detect foreign text bubbles and automatically translate dialogues into clean English overlays."
              color="text-orange-400"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Cinematic Camera FX"
              description="Add dynamic camera pans, zooms, shake effects, and parallax depth to bring static panels to life."
              color="text-rose-400"
            />
            <FeatureCard
              icon={<Video className="w-8 h-8" />}
              title="TikTok & Shorts Ready"
              description="Export vertically formatted 1080p/4K MP4 videos with auto-subtitles, ready to publish in minutes."
              color="text-indigo-400"
            />
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SHOWCASE */}
      <section
        id="transformation-demo"
        className="py-32 px-6 relative overflow-hidden scroll-mt-24"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Interactive Preview
            </span>
            <h2
              className={`text-4xl md:text-5xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              See the Transformation Magic
            </h2>
            <p
              className={`max-w-xl mx-auto text-base ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Switch between tabs below to inspect how raw webtoon chapters become animated, voiced video clips.
            </p>
          </div>

          {/* Tabs Control */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              {
                id: "slicing",
                label: "Auto Panel Slicing",
                icon: <Scissors className="w-4 h-4" />,
              },
              {
                id: "bubbles",
                label: "Speech Bubble Eraser",
                icon: <Layers className="w-4 h-4" />,
              },
              {
                id: "translation",
                label: "Auto Translation",
                icon: <Languages className="w-4 h-4" />,
              },
              {
                id: "render",
                label: "Cinematic Rendering",
                icon: <Tv className="w-4 h-4" />,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDemoTab(t.id as any)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                  demoTab === t.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30"
                    : isLight
                    ? "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    : "bg-neutral-900/60 text-neutral-400 border border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Interactive Visual Grid */}
          <div className="max-w-4xl mx-auto">
            {demoTab !== "render" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-[420px]">
                <div
                  className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 relative ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-white/10 bg-neutral-950"
                  }`}
                >
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/60 text-white backdrop-blur-md">
                    Before (Raw Chapter)
                  </div>
                  {demoTab === "slicing" && <SlicingBefore />}
                  {demoTab === "bubbles" && <BubblesBefore />}
                  {demoTab === "translation" && <TranslationBefore />}
                </div>
                <div
                  className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 relative ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-white/10 bg-neutral-950"
                  }`}
                >
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-600 text-white shadow-md">
                    After (AI Processed)
                  </div>
                  {demoTab === "slicing" && <SlicingAfter />}
                  {demoTab === "bubbles" && <BubblesAfter />}
                  {demoTab === "translation" && <TranslationAfter />}
                </div>
              </div>
            ) : (
              <CinematicRenderDemo onGetStarted={onGetStarted} />
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`py-32 px-6 transition-colors ${
        isLight ? "bg-slate-100/50" : "bg-neutral-950/40"
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
                Simple Workflow
              </span>
              <h2
                className={`text-4xl md:text-5xl font-black tracking-tighter ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                3 Simple Steps to Create Your First Video
              </h2>
            </div>

            <div className="space-y-8">
              <Step
                num="01"
                title="Paste Webtoon Link"
                desc="Paste your favorite webtoon chapter URL or drag-and-drop raw comic image files into the workspace."
              />
              <Step
                num="02"
                title="AI Slicing & Voice Dubbing"
                desc="Sonikoma isolates comic panels, erases text bubbles, and assigns character voice tracks automatically."
              />
              <Step
                num="03"
                title="Export & Publish"
                desc="Preview your animated 1080p/4K video and publish directly to TikTok, YouTube Shorts, or Instagram Reels."
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[36px] blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
            <div
              className={`relative border rounded-[32px] overflow-hidden aspect-video shadow-2xl flex flex-col items-center justify-center transition-all duration-300 p-8 ${
                isLight
                  ? "bg-slate-900 border-slate-200 text-white"
                  : "bg-neutral-900 border-white/10 text-white"
              }`}
            >
              <div
                onClick={onGetStarted}
                className="w-20 h-20 rounded-full bg-purple-600/90 hover:bg-purple-500 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xl shadow-purple-600/40 group-hover:animate-pulse mb-4"
              >
                <Play className="w-8 h-8 text-white ml-1 fill-white" />
              </div>
              <span className="text-sm font-bold tracking-wide text-neutral-300">
                Click to Watch Interactive Demo
              </span>
              <span className="text-xs text-neutral-500 mt-1">
                4K Ultra HD Export • 60 FPS Camera Pan
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Simple & Transparent
            </span>
            <h2
              className={`text-4xl md:text-5xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Choose the Plan for Your Channel
            </h2>
            <p
              className={`max-w-xl mx-auto text-base ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Start free, upgrade as your subscriber base grows. No hidden fees.
            </p>

            {/* BILLING TOGGLE */}
            <div className="pt-4 flex items-center justify-center gap-4">
              <span
                className={`text-sm font-bold ${
                  billingCycle === "monthly"
                    ? isLight ? "text-slate-900" : "text-white"
                    : isLight ? "text-slate-400" : "text-neutral-500"
                }`}
              >
                Monthly Billing
              </span>
              <button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly"
                  )
                }
                className="w-14 h-8 rounded-full bg-purple-600/30 p-1 border border-purple-500/40 relative transition-colors cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-purple-600 transition-transform ${
                    billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-bold ${
                    billingCycle === "yearly"
                      ? isLight ? "text-slate-900" : "text-white"
                      : isLight ? "text-slate-400" : "text-neutral-500"
                  }`}
                >
                  Yearly Billing
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  SAVE 20%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            <PricingCard
              title="Free Starter"
              price={0}
              billingPeriod="forever"
              desc="Perfect for trying out Sonikoma on your first webtoon videos."
              features={[
                "3 Video Exports / month",
                "720p HD Video Resolution",
                "Automatic Panel Slicing",
                "Standard AI Speech Eraser",
                "Community Discord Support",
              ]}
              excludedFeatures={[
                "Multi-character Voice Dubbing",
                "Custom 4K Video Exports",
                "Priority Server Processing",
              ]}
              btnText="Start Free"
              onClick={onGetStarted}
              themeMode={themeMode}
            />

            <PricingCard
              title="Pro Animator"
              price={billingCycle === "yearly" ? 19 : 24}
              billingPeriod={billingCycle === "yearly" ? "/mo (billed yearly)" : "/month"}
              desc="Best for active TikTokers, Shorts creators, and webtoon recap channels."
              isPopular={true}
              features={[
                "Unlimited Video Exports",
                "1080p & 4K Ultra HD Resolution",
                "Advanced AI Inpainting Eraser",
                "Multi-character TTS Voice Dubbing",
                "Auto English Translation",
                "No Sonikoma Watermark",
                "Fast Priority Processing",
              ]}
              btnText="Upgrade to Pro"
              onClick={onGetStarted}
              themeMode={themeMode}
            />

            <PricingCard
              title="Studio / Agency"
              price={billingCycle === "yearly" ? 49 : 59}
              billingPeriod={billingCycle === "yearly" ? "/mo (billed yearly)" : "/month"}
              desc="Designed for digital studios, webtoon publishers, and multi-channel networks."
              features={[
                "Everything in Pro",
                "Commercial Usage License",
                "Custom Voice Model Cloning",
                "Batch Chapter Processing",
                "API Access for Bulk Generation",
                "Dedicated Account Manager",
              ]}
              btnText="Contact Sales"
              onClick={onGetStarted}
              themeMode={themeMode}
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className={`py-32 px-6 scroll-mt-24 transition-colors ${
          isLight ? "bg-slate-100/50" : "bg-neutral-950/40"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Loved by Creators
            </span>
            <h2
              className={`text-4xl md:text-5xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Trusted by 10,000+ Comic Animators
            </h2>
            <p
              className={`max-w-xl mx-auto text-base ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Here is what top YouTube Shorts, TikTok, and webtoon creators say about Sonikoma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <TestimonialCard
                key={idx}
                quote={t.quote}
                author={t.author}
                handle={t.handle}
                rating={t.rating}
                role={t.role}
                avatar={t.avatar}
                stats={t.stats}
                themeMode={themeMode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-32 px-6 scroll-mt-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-500">
              Got Questions?
            </span>
            <h2
              className={`text-4xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Frequently Asked Questions
            </h2>
            <p
              className={`text-sm ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Everything you need to know about Sonikoma comic video generation.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isLight
                      ? "bg-white border-slate-200 shadow-xs"
                      : "bg-neutral-900/50 border-white/10"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span
                      className={`font-bold text-base md:text-lg ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-purple-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      className={`px-6 pb-6 pt-0 text-sm leading-relaxed border-t transition-colors ${
                        isLight
                          ? "border-slate-100 text-slate-600"
                          : "border-white/5 text-neutral-300"
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

      {/* NEWSLETTER SIGNUP */}
      <section
        className={`py-24 px-6 border-t relative overflow-hidden transition-colors ${
          isLight ? "border-slate-200" : "border-white/5"
        }`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div
          className={`max-w-4xl mx-auto border rounded-[32px] p-8 md:p-12 relative z-10 text-center space-y-6 shadow-2xl transition-all ${
            isLight
              ? "bg-white border-slate-200 shadow-xl shadow-purple-500/5"
              : "bg-gradient-to-r from-neutral-900 to-neutral-950 border-white/10"
          }`}
        >
          <h3
            className={`text-3xl font-black transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Stay Ahead in Comic Animation
          </h3>
          <p
            className={`max-w-lg mx-auto text-sm transition-colors ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Subscribe to our weekly creator newsletter for early feature updates, viral TikTok growth tips, and voice cloning guides.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 px-4 py-3.5 rounded-xl outline-none text-sm transition-all ${
                isLight
                  ? "bg-slate-100 border border-slate-200 text-slate-900 focus:border-purple-500 focus:bg-white placeholder:text-slate-400"
                  : "bg-neutral-800 border border-white/10 text-white focus:border-purple-500 placeholder:text-neutral-500"
              }`}
            />
            <button
              type="submit"
              disabled={newsState === "loading"}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {newsState === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Subscribe
                </>
              )}
            </button>
          </form>
          {newsState === "success" && (
            <p className="text-emerald-500 text-sm font-semibold">
              ✓ Thanks for subscribing! Welcome aboard.
            </p>
          )}
          {newsState === "error" && (
            <p className="text-rose-500 text-sm font-semibold">
              Please enter a valid email address.
            </p>
          )}
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 rounded-[40px] p-12 md:p-20 text-center space-y-8 shadow-2xl shadow-purple-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20 uppercase tracking-wider relative z-10">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            Join 10,000+ Creators Today
          </span>

          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight relative z-10">
            Ready to Make Your Comics Move?
          </h2>

          <p className="max-w-xl mx-auto text-purple-100 text-base md:text-lg font-medium relative z-10">
            Transform any webtoon chapter into voiced vertical videos in seconds.
          </p>

          <button
            onClick={onGetStarted}
            className="relative z-10 mx-auto px-9 py-4.5 bg-white text-purple-700 font-black rounded-2xl hover:bg-neutral-100 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer text-base flex items-center justify-center gap-2"
          >
            Start Your First Video Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <LandingFooter />
    </div>
  );
}

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
  Languages,
  Tv,
  ArrowRight,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { useLandingPage } from "@/features/app_landing/hooks";
import {
  FeatureCard,
  PricingCard,
  LandingFooter,
  SlicingBefore,
  SlicingAfter,
  BubblesBefore,
  BubblesAfter,
  TranslationBefore,
  TranslationAfter,
  CinematicRenderDemo,
  LandingAnimeScene,
} from "@/features/app_landing/components";

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
    q: "How does Sonikoma convert webtoon chapters into videos?",
    a: "Sonikoma automatically fetches chapter images from supported URLs, detects panel boundaries using AI vision models, removes speech bubbles, generates natural character voiceovers via TTS, and renders smooth motion camera pans to produce 1080p/4K vertical videos ready for TikTok, Shorts, and Reels.",
  },
  {
    q: "What webtoon & manga platforms are supported?",
    a: "Sonikoma supports direct URL importing from WEBTOON, MangaDex, Naver Webtoon, KakaoPage, Tapas, Asura Scans, and custom image file uploads (PNG, JPG, WEBP).",
  },
  {
    q: "Can I translate foreign webtoons (Korean/Japanese) into English?",
    a: "Yes! Our built-in AI Translation engine detects speech bubble text in Korean, Japanese, Chinese, or Spanish, cleans up original text bubbles, and overlays translated text or voiced character lines in English.",
  },
  {
    q: "Can I customize character voices, background music, and camera speed?",
    a: "Absolutely. You can assign distinct voice profiles to different comic characters, choose background soundtrack mood presets (Action, Mystery, Romance), and adjust zoom/pan camera speeds per panel.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes! You can start with our Free Creator plan which includes 3 video exports per month, automatic panel slicing, and standard AI voice options without entering a credit card.",
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
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              const el = document.getElementById("landing-scroll-area");
              if (el) el.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm">
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
                  isLight ? "text-slate-950" : "text-white"
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

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", target: "features" },
              { label: "Demo", target: "transformation-demo" },
              { label: "Pricing", target: "pricing" },
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
                    ? "text-slate-700 hover:text-slate-950"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className={`hidden sm:inline-flex px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                isLight
                  ? "text-slate-800 hover:text-slate-950"
                  : "text-neutral-200 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
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
        {/* HERO SECTION WITH SCOPED AMBIENT BACKGROUND */}
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
              Make Your Comics Move
            </div>

            <h1
              className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Turn Webtoons Into <br />
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
              Paste a link, slice panels, erase speech bubbles, add AI voices,
              and export ready-to-publish TikTok, Shorts, and Reels in seconds.
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
                        : "bg-[#181818] border-[#2F2F2F] focus-within:border-blue-500"
                    }`}
                  >
                    <Globe
                      className={`w-4 h-4 shrink-0 ${
                        isLight ? "text-blue-600" : "text-blue-400"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Paste Webtoon, MangaDex, or Naver chapter URL..."
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      className={`flex-1 bg-transparent outline-none text-sm min-w-0 transition-colors ${
                        isLight
                          ? "text-slate-900 placeholder:text-slate-500 font-medium"
                          : "text-white placeholder:text-neutral-500 font-medium"
                      }`}
                    />
                  </div>
                  <button
                    onClick={onGetStarted}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Start Creating
                  </button>
                </div>

                {/* SAMPLES */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isLight ? "text-slate-800" : "text-neutral-300"
                    }`}
                  >
                    Try sample:
                  </span>
                  {SAMPLE_URLS.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => setLandingUrl(sample.url)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        isLight
                          ? "bg-slate-100 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
                          : "bg-[#181818] border-[#2F2F2F] text-neutral-300 hover:border-blue-500 hover:text-blue-300"
                      }`}
                    >
                      {sample.name}
                    </button>
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
                  Instant 4K Video Export
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section
          id="features"
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
                Core Capabilities
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                Everything You Need to Animate Comics
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm leading-relaxed font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                Automated image slicing, text removal, voice synthesis, and dynamic camera movements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Globe className="w-6 h-6" />}
                title="1-Click Chapter Importing"
                description="Grab high-res comic panel images from any chapter link with automatic deduplication."
                color="text-blue-400"
                themeMode={themeMode}
              />
              <FeatureCard
                icon={<Scissors className="w-6 h-6" />}
                title="AI Panel Slicing Engine"
                description="Our computer vision model isolates comic panels automatically, removing borders and margins."
                color="text-blue-400"
                themeMode={themeMode}
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Inpainting Speech Eraser"
                description="Erase speech bubbles cleanly with AI inpainting so background character artwork looks untouched."
                color="text-blue-400"
                themeMode={themeMode}
              />
              <FeatureCard
                icon={<Languages className="w-6 h-6" />}
                title="Smart Translation & OCR"
                description="Detect foreign text bubbles and automatically translate dialogues into clean English overlays."
                color="text-blue-400"
                themeMode={themeMode}
              />
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="Cinematic Camera FX"
                description="Add dynamic camera pans, zooms, shake effects, and parallax depth to bring static panels to life."
                color="text-blue-400"
                themeMode={themeMode}
              />
              <FeatureCard
                icon={<Video className="w-6 h-6" />}
                title="TikTok & Shorts Ready"
                description="Export vertical 1080p/4K MP4 videos with auto-subtitles, ready to publish in minutes."
                color="text-blue-400"
                themeMode={themeMode}
              />
            </div>
          </div>
        </section>

        {/* INTERACTIVE DEMO SHOWCASE */}
        <section
          id="transformation-demo"
          className="pt-28 pb-24 px-6 relative overflow-hidden scroll-mt-24 z-10"
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-widest ${
                  isLight ? "text-blue-700" : "text-blue-400"
                }`}
              >
                Interactive Preview
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                See the Transformation in Action
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                Select a stage below to see how raw webtoon chapters become voiced vertical videos.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                {
                  id: "slicing",
                  label: "Panel Slicing",
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    demoTab === t.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : isLight
                      ? "bg-white text-slate-800 border border-slate-300 hover:border-slate-400 hover:text-slate-950"
                      : "bg-[#181818] text-neutral-300 border border-[#2F2F2F] hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Visual Demo Showcase */}
            <div className="max-w-4xl mx-auto">
              {demoTab !== "render" ? (
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
                        Before (Raw Chapter)
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
              ) : (
                <CinematicRenderDemo onGetStarted={onGetStarted} />
              )}
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
                Plans & Pricing
              </span>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                Simple, Predictable Pricing
              </h2>
              <p
                className={`max-w-xl mx-auto text-sm font-medium ${
                  isLight ? "text-slate-700" : "text-neutral-400"
                }`}
              >
                Start free and upgrade when you are ready to produce more content.
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
                <button
                  onClick={() =>
                    setBillingCycle(
                      billingCycle === "monthly" ? "yearly" : "monthly"
                    )
                  }
                  className="w-12 h-7 rounded-full bg-blue-600/20 p-1 border border-blue-500/30 relative transition-colors cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-blue-600 transition-transform ${
                      billingCycle === "yearly"
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
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
                desc="Try out Sonikoma on your first webtoon videos."
                features={[
                  "3 Video Exports / month",
                  "720p HD Video Resolution",
                  "Automatic Panel Slicing",
                  "Standard AI Speech Eraser",
                ]}
                excludedFeatures={[
                  "Multi-character Voice Dubbing",
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
                  "1080p & 4K Ultra HD Resolution",
                  "Advanced AI Inpainting Eraser",
                  "Multi-character TTS Voice Dubbing",
                  "Auto English Translation",
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
                  "Custom Voice Model Cloning",
                  "Batch Chapter Processing",
                  "Priority GPU Processing",
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
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isLight
                        ? "bg-white border-slate-200 shadow-xs"
                        : "bg-[#181818] border-[#2F2F2F]"
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

        {/* CALL TO ACTION BANNER (MATCHING STUDIO CARD) */}
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
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Get Started Now
            </span>

            <h2
              className={`text-3xl md:text-5xl font-black leading-tight transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Ready to Make Your Comics Move?
            </h2>

            <p
              className={`max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed transition-colors ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Transform any webtoon chapter into voiced vertical videos in seconds.
            </p>

            <button
              onClick={onGetStarted}
              className="mx-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md"
            >
              Start Creating Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <LandingFooter />
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { useLandingPage, useNewsletterForm } from "./hooks";
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
} from "./components";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
}

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

  return (
    <div className={`min-h-screen transition-colors duration-300 selection:bg-purple-200 ${
      themeMode === "light" ? "bg-[#f7f7f9] text-slate-900" : "bg-[#09090b] text-neutral-100"
    }`}>
      {/* NAVIGATION */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
        themeMode === "light"
          ? "bg-white/95 border-slate-200"
          : "bg-neutral-950/95 border-neutral-800"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="w-10 h-10 rounded-xl shadow-lg shadow-purple-200/50 group-hover:scale-110 transition-transform object-cover bg-white"
              alt="Sonikoma Logo"
            />
            <span className={`text-xl font-black tracking-tighter uppercase transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-900" : "text-white"
            }`}>
              Sonikoma
            </span>
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
                  themeMode === "light"
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleThemeMode}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                themeMode === "light"
                  ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  : "bg-neutral-850 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
              title={themeMode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {themeMode === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </button>
            <button
              onClick={onLogin}
              className={`px-6 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                themeMode === "light"
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-purple-600 text-white text-sm font-black rounded-xl hover:bg-purple-500 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/12 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase border transition-colors duration-300 ${
            themeMode === "light"
              ? "bg-purple-100 border-purple-200 text-purple-600"
              : "bg-purple-950/40 border-purple-900/55 text-purple-400"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            Make Your Comics Move
          </div>
          <h1 className={`text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto transition-colors duration-300 ${
            themeMode === "light" ? "text-slate-950" : "text-white"
          }`}>
            Turn Comics Into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400">
              Awesome Videos
            </span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed transition-colors duration-300 ${
            themeMode === "light" ? "text-slate-600" : "text-neutral-400"
          }`}>
            Just paste a link, and we'll turn your favorite webtoons into fully
            voiced, animated videos that are ready to share with the world.
          </p>
          <div className="pt-8 max-w-4xl mx-auto w-full text-left">
            <div className={`rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 space-y-5 sm:space-y-6 min-w-0 w-full overflow-hidden ${
              themeMode === "light"
                ? "bg-white border-slate-200 shadow-[0_20px_80px_rgba(99,102,241,0.08)] shadow-purple-200/40"
                : "bg-neutral-900 border-neutral-800 shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
            }`}>
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest shrink-0">
                  URL
                </span>
                <input
                  type="text"
                  placeholder="Paste a webtoon chapter link here..."
                  value={landingUrl}
                  onChange={(e) => setLandingUrl(e.target.value)}
                  className={`flex-1 bg-transparent outline-none min-w-0 transition-colors duration-300 ${
                    themeMode === "light"
                      ? "text-slate-900 placeholder:text-slate-400"
                      : "text-white placeholder:text-neutral-500"
                  }`}
                />
              </div>
              <button
                onClick={onGetStarted}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-purple-600/50 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Start Creating Now
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 pt-6">
              <span className={`text-xs font-mono transition-colors duration-300 ${
                themeMode === "light" ? "text-slate-500" : "text-neutral-400"
              }`}>
                ✓ Works with ToonCrew, MangaDex, Webtoon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className={`border-y py-12 relative overflow-hidden transition-colors duration-300 ${
        themeMode === "light"
          ? "border-slate-200 bg-slate-100"
          : "border-neutral-800 bg-neutral-900/30"
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              1.4M+
            </div>
            <div className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-500" : "text-neutral-400"
            }`}>
              Panels Processed
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              84K+
            </div>
            <div className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-500" : "text-neutral-400"
            }`}>
              Videos Exported
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
              92%
            </div>
            <div className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-500" : "text-neutral-400"
            }`}>
              Editing Time Saved
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
              4.9/5
            </div>
            <div className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-500" : "text-neutral-400"
            }`}>
              Creator Rating
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section
        id="features"
        className={`py-32 px-6 scroll-mt-24 transition-colors duration-300 ${
          themeMode === "light" ? "bg-slate-50" : "bg-neutral-950/20"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-900" : "text-white"
            }`}>
              Built for Creators
            </h2>
            <p className={`max-w-xl mx-auto transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-600" : "text-neutral-400"
            }`}>
              We handle the boring, repetitive tasks so you can focus on making
              great content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="Easy Link Importing"
              description="Grab all the images from a chapter with just one click."
              color="text-blue-400"
            />
            <FeatureCard
              icon={<Scissors className="w-8 h-8" />}
              title="Auto Panel Cropping"
              description="We automatically find and cut out each comic panel for you."
              color="text-purple-400"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Clean Up Text Bubbles"
              description="Erase speech bubbles instantly so your panels look completely clean."
              color="text-emerald-400"
            />
            <FeatureCard
              icon={<Layers className="w-8 h-8" />}
              title="Smart Scripting"
              description="Easily translate stories or create character voices with our built-in helpers."
              color="text-orange-400"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Add Cool Animations"
              description="Bring your panels to life with smooth camera pans and zooms."
              color="text-rose-400"
            />
            <FeatureCard
              icon={<Video className="w-8 h-8" />}
              title="Ready to Share"
              description="Save your final video and post it straight to TikTok or YouTube."
              color="text-indigo-400"
            />
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <section
        id="transformation-demo"
        className="py-32 px-6 relative overflow-hidden scroll-mt-24"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-900" : "text-white"
            }`}>
              See the Magic Happen
            </h2>
            <p className={`max-w-xl mx-auto transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-600" : "text-neutral-400"
            }`}>
              Slide back and forth to see how we turn plain comic pages into
              clean, video-ready panels.
            </p>
          </div>

          {/* Tabs Control */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              {
                id: "slicing",
                label: "Auto-Slicing",
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
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all cursor-pointer ${
                  demoTab === t.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-650/20"
                    : themeMode === "light"
                      ? "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                      : "bg-neutral-900/50 text-neutral-400 border border-white/10 hover:border-white/20"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Interactive Screen Grid */}
          <div className="max-w-4xl mx-auto">
            {demoTab !== "render" ? (
              <div className="grid grid-cols-2 gap-4 h-96">
                <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 ${
                  themeMode === "light"
                    ? "border-slate-200 bg-white"
                    : "border-white/10 bg-neutral-950"
                }`}>
                  {demoTab === "slicing" && <SlicingBefore />}
                  {demoTab === "bubbles" && <BubblesBefore />}
                  {demoTab === "translation" && <TranslationBefore />}
                </div>
                <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 ${
                  themeMode === "light"
                    ? "border-slate-200 bg-white"
                    : "border-white/10 bg-neutral-950"
                }`}>
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
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className={`text-5xl font-black tracking-tighter transition-colors duration-300 ${
              themeMode === "light" ? "text-slate-950" : "text-white"
            }`}>
              How It Works
            </h2>
            <div className="space-y-8">
              <Step
                num="01"
                title="Paste your link"
                desc="Just give us the link to your favorite webtoon chapter and we'll handle the rest."
              />
              <Step
                num="02"
                title="We Do the Heavy Lifting"
                desc="We automatically separate the panels, add character voices, and bring the comic to life."
              />
              <Step
                num="03"
                title="Watch & Share"
                desc="Preview your video and save it to share with the world."
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className={`relative border rounded-[32px] overflow-hidden aspect-video shadow-2xl flex items-center justify-center transition-all duration-300 ${
              themeMode === "light"
                ? "bg-slate-900 border-slate-200"
                : "bg-neutral-900 border-white/10"
            }`}>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SIGNUP */}
      <section className={`py-32 px-6 border-t relative overflow-hidden transition-colors duration-300 ${
        themeMode === "light" ? "border-slate-200" : "border-white/5"
      }`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
        <div className={`max-w-4xl mx-auto border rounded-[32px] p-8 md:p-12 relative z-10 text-center space-y-6 shadow-2xl transition-all duration-300 ${
          themeMode === "light"
            ? "bg-gradient-to-r from-white to-slate-50 border-slate-200"
            : "bg-gradient-to-r from-neutral-900 to-neutral-950 border-white/5"
        }`}>
          <h3 className={`text-3xl font-black transition-colors duration-300 ${
            themeMode === "light" ? "text-slate-950" : "text-white"
          }`}>Stay Updated</h3>
          <p className={`transition-colors duration-300 ${
            themeMode === "light" ? "text-slate-600" : "text-neutral-400"
          }`}>
            Get early access to new features and exclusive creator tips.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl focus:border-purple-500 outline-none transition-all ${
                themeMode === "light"
                  ? "bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400"
                  : "bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-500"
              }`}
            />
            <button
              type="submit"
              disabled={newsState === "loading"}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 disabled:opacity-50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
            <p className="text-emerald-400 text-sm font-semibold">
              ✓ Thanks for subscribing!
            </p>
          )}
          {newsState === "error" && (
            <p className="text-rose-400 text-sm font-semibold">
              Please enter a valid email
            </p>
          )}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[40px] p-12 md:p-20 text-center space-y-8 shadow-2xl shadow-purple-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-black text-white relative z-10">
            Ready to Create?
          </h2>
          <button
            onClick={onGetStarted}
            className="relative z-10 mx-auto px-8 py-4 bg-white text-purple-600 font-black rounded-2xl hover:bg-neutral-100 transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            Start Your First Video Today
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <LandingFooter />
    </div>
  );
}

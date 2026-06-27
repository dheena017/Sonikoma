import React from "react";
import {
  Play,
  Sparkles,
  Scissors,
  Zap,
  Video,
  Layers,
  ArrowRight,
  Github,
  Twitter,
  Youtube,
  Globe,
  // Added icons
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  Loader2,
  Volume2,
  Languages,
  Tv,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({
  onGetStarted,
  onLogin,
}: LandingPageProps) {
  // State for interactive demo
  const [demoTab, setDemoTab] = React.useState<
    "slicing" | "bubbles" | "translation" | "render"
  >("slicing");
  const [sliderPos, setSliderPos] = React.useState<number>(50);

  // State for URL Input
  const [landingUrl, setLandingUrl] = React.useState("");

  // State for pricing billing cycle (monthly vs annual)
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">(
    "monthly"
  );

  // State for FAQ accordion (tracks open indices)
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // State for newsletter signup form
  const [email, setEmail] = React.useState("");
  const [newsState, setNewsState] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setNewsState("error");
      return;
    }
    setNewsState("loading");
    setTimeout(() => {
      setNewsState("success");
      setEmail("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-purple-600">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="/logo-dark.png"
              className="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform object-cover bg-black"
              alt="Sonikoma Logo"
            />
            <span className="text-xl font-black tracking-tighter text-neutral-100 uppercase">
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
                  const element = document.getElementById(link.target);
                  element?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="text-sm font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer relative py-2 group bg-transparent border-0"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2.5 text-sm font-bold text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-neutral-100 text-neutral-900 text-sm font-black rounded-xl hover:bg-neutral-300 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Make Your Comics Move
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
            Turn Comics Into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400">
              Awesome Videos
            </span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Just paste a link, and we'll turn your favorite webtoons into fully
            voiced, animated videos that are ready to share with the world.
          </p>
          <div className="pt-8 max-w-4xl mx-auto w-full text-left">
            <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-5 sm:p-6 lg:p-8 backdrop-blur-md shadow-sm space-y-5 sm:space-y-6 min-w-0 w-full overflow-hidden">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase font-mono">
                    Quick Link Importer
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight leading-tight">
                  Turn a Link into a Video
                </h2>
                <p className="text-[10px] sm:text-xs text-neutral-400 font-sans leading-relaxed">
                  Paste a link to any comic or manga chapter to get started.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative group flex-grow">
                    <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-300" />
                    <input
                      type="url"
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && landingUrl.trim()) {
                          window.location.href = `/workspace?url=${encodeURIComponent(
                            landingUrl
                          )}`;
                        }
                      }}
                      placeholder="Paste any comic or manga viewer URL (e.g. example.com/comic/chapter-1)"
                      className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (landingUrl.trim()) {
                        const token =
                          localStorage.getItem("sonikoma_token") ||
                          sessionStorage.getItem("sonikoma_token");
                        if (!token) {
                          const usedFree = localStorage.getItem(
                            "sonikoma_free_scrape_used"
                          );
                          if (usedFree === "true") {
                            // If they already used their free scrape, force them to login
                            window.location.href = "/login";
                            return;
                          }
                        }
                        window.location.href = `/workspace?url=${encodeURIComponent(
                          landingUrl
                        )}&autoScrape=true`;
                      }
                    }}
                    disabled={!landingUrl.trim()}
                    className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 group overflow-hidden shrink-0 flex items-center justify-center gap-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-4 h-4" />
                    Import Images
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => {
                  const element = document.getElementById(
                    "transformation-demo"
                  );
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-100 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="border-y border-white/5 bg-neutral-900/10 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              1.4M+
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Panels Processed
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              84K+
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Videos Exported
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
              92%
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Editing Time Saved
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
              4.9/5
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Creator Rating
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section
        id="features"
        className="py-32 px-6 bg-neutral-900/20 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Built for Creators
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
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

      {/* INTERACTIVE DEMO (TRANSFORMATION LIVE) */}
      <section
        id="transformation-demo"
        className="py-32 px-6 relative overflow-hidden scroll-mt-24"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              See the Magic Happen
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
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
                onClick={() => {
                  setDemoTab(t.id as any);
                  setSliderPos(50);
                }}
                className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  demoTab === t.id
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/25 scale-105"
                    : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-neutral-100 hover:border-white/10"
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
              <div className="space-y-4">
                <div className="relative w-full h-[450px] md:h-[500px] rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden select-none shadow-2xl">
                  {/* Background: After State */}
                  <div className="absolute inset-0 w-full h-full">
                    {demoTab === "slicing" && <SlicingAfter />}
                    {demoTab === "bubbles" && <BubblesAfter />}
                    {demoTab === "translation" && <TranslationAfter />}
                  </div>

                  {/* Foreground: Before State, clipped by slider width */}
                  <div
                    className="absolute inset-y-0 left-0 border-r border-purple-500 z-10 overflow-hidden transition-all duration-75"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        width: "100%",
                        minWidth: "100%",
                        height: "100%",
                      }}
                    >
                      {demoTab === "slicing" && <SlicingBefore />}
                      {demoTab === "bubbles" && <BubblesBefore />}
                      {demoTab === "translation" && <TranslationBefore />}
                    </div>
                  </div>

                  {/* Knob */}
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center"
                    style={{ left: `calc(${sliderPos}% - 16px)` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-xl shadow-purple-600/50">
                      <div className="flex items-center gap-[2px]">
                        <div className="w-[2px] h-3 bg-white/80 rounded" />
                        <div className="w-[2px] h-3 bg-white/80 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Real slider input overlay */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  />

                  {/* Split Screen Labels */}
                  <div className="absolute bottom-4 left-4 z-20 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-mono text-neutral-400 border border-white/5">
                    Before (Raw Webtoon)
                  </div>
                  <div className="absolute bottom-4 right-4 z-20 px-3 py-1 bg-purple-950/80 backdrop-blur-md rounded-lg text-[10px] font-mono text-purple-200 border border-purple-500/20">
                    After (Enhanced)
                  </div>
                </div>
                <p className="text-center text-xs text-neutral-500 font-mono">
                  ← Slide left/right to compare target outputs →
                </p>
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
            <h2 className="text-5xl font-black tracking-tighter">
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
            <div className="relative bg-neutral-900 border border-white/10 rounded-[32px] overflow-hidden aspect-video shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-neutral-100 fill-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section
        id="pricing"
        className="py-32 px-6 bg-neutral-900/10 border-y border-white/5 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Flexible Plans for Every Creator
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Start for free and scale as you grow. Save 20% on all plans with
              annual billing.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span
                className={`text-sm ${
                  billingCycle === "monthly"
                    ? "text-neutral-100 font-bold"
                    : "text-neutral-500"
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
                className="w-12 h-6 rounded-full bg-neutral-800 p-1 flex items-center transition-all relative border border-white/5 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-purple-550 transition-transform ${
                    billingCycle === "yearly" ? "translate-x-6" : ""
                  }`}
                />
              </button>
              <span
                className={`text-sm flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "text-neutral-100 font-bold"
                    : "text-neutral-500"
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <PricingCard
              title="Hobbyist"
              price={0}
              desc="Perfect for trying out Sonikoma and exploring comic animation."
              features={[
                "5 video exports per month",
                "Standard rendering queue",
                "Standard voice generation",
                "Watermarked video files",
                "Basic panel auto-slicing",
              ]}
              excludedFeatures={[
                "Custom voice cloning",
                "HD/4K export",
                "Speech bubble clearing",
                "API access",
              ]}
              btnText="Get Started Free"
              onClick={onGetStarted}
            />

            {/* Pro Plan */}
            <PricingCard
              title="Creator Pro"
              price={billingCycle === "monthly" ? 19 : 15}
              desc="Unlimited power for serious webtoon animators and content creators."
              features={[
                "Unlimited video exports",
                "Priority rendering queue",
                "Custom TTS voice cloning",
                "Watermark-free 1080p outputs",
                "Advanced computer vision bubble cleaning",
                "Full translation suite",
              ]}
              excludedFeatures={["4K rendering", "API access"]}
              isPopular={true}
              btnText="Upgrade to Pro"
              onClick={onGetStarted}
            />

            {/* Enterprise Plan */}
            <PricingCard
              title="Studio Elite"
              price={billingCycle === "monthly" ? 99 : 79}
              desc="Custom scaling, automation integrations, and full API access for studios."
              features={[
                "Everything in Creator Pro",
                "4K Ultra-HD exports",
                "Multi-seat collaborative workspace",
                "Full developer API access",
                "24/7 dedicated priority support",
                "Custom legal licensing clearance",
              ]}
              excludedFeatures={[]}
              btnText="Get Studio Access"
              onClick={onGetStarted}
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Loved by Webtoon Creators
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              See how animators, content creators, and comic artists are
              leveraging Sonikoma to scale their production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Sonikoma cut my YouTube Shorts creation time from 6 hours to 15 minutes. The panel auto-slicer is magic, and bubble removal is insanely clean!"
              author="Alex Rivers"
              handle="@ComicReversed"
              rating={5}
              role="Webtoon Recap YouTuber (240K Subs)"
              avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            />
            <TestimonialCard
              quote="The generated voices sound incredibly natural. Combining voice acting with auto translation allowed me to localize my Korean webtoon into English instantly."
              author="Sujin Park"
              handle="@sujin_draws"
              rating={5}
              role="Independent Webtoon Artist"
              avatar="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces"
            />
            <TestimonialCard
              quote="Our animation studio uses the Studio plan to create marketing teasers for our releases. The API integration and 4K exporting fits perfectly in our workflow."
              author="Marcus Sterling"
              handle="@sterling_studios"
              rating={5}
              role="Creative Director at Sterling Comics"
              avatar="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces"
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section
        id="faq"
        className="py-32 px-6 bg-neutral-900/10 border-t border-white/5 scroll-mt-24"
      >
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-500">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the image importer work?",
                a: "Simply paste the URL of a comic or webtoon chapter. Sonikoma fetches the high-resolution strip images and parses metadata automatically from major hosting platforms.",
              },
              {
                q: "Who owns the rights to the exported videos?",
                a: "You retain full ownership of the transformed outputs. However, ensure you have the necessary permissions from the original content creators or publishers if you plan to monetize copyright-restricted comics.",
              },
              {
                q: "Can I use my own voice clones for narration?",
                a: "Yes! Creator Pro and Studio plans allow you to upload audio samples to clone your own voice or train custom character voices for immersive narrative experiences.",
              },
              {
                q: "What platforms are supported by the importer?",
                a: "We support major public webtoon hubs (Line Webtoon, Tapas, and major community archives). You can also upload your own local image folders (JPEG/PNG) directly to crop.",
              },
              {
                q: "What export formats and aspect ratios are available?",
                a: "We support standard MP4 and WebM file exports. You can choose from multiple aspect ratios: 9:16 Vertical (ideal for YouTube Shorts, TikTok, Instagram Reels) and 16:9 Landscape (standard YouTube format).",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-white/5 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/40 transition-all overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-semibold text-neutral-100 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  )}
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openFaq === idx
                      ? "max-h-40 border-t border-white/5 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="p-6 text-sm text-neutral-400 leading-relaxed bg-neutral-900/30">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER SIGNUP */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-neutral-900 to-neutral-950 border border-white/5 rounded-[32px] p-8 md:p-12 relative z-10 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">
              Join the Newsletter
            </h3>
            <p className="text-neutral-400 text-sm max-w-md mx-auto">
              Get product updates, video making tips, and the latest news from
              our team.
            </p>
          </div>
          <form
            onSubmit={handleSubscribe}
            className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3"
          >
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (newsState === "error") setNewsState("idle");
              }}
              disabled={newsState === "loading" || newsState === "success"}
              className="w-full px-5 py-3.5 bg-neutral-950 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none text-neutral-100 text-sm transition-all placeholder:text-neutral-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={newsState === "loading" || newsState === "success"}
              className="w-full sm:w-auto px-6 py-3.5 bg-purple-650 hover:bg-purple-600 disabled:bg-neutral-850 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group active:scale-95 animate-pulse-slow"
            >
              {newsState === "loading" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {newsState === "success" && <Check className="w-4 h-4" />}
              {newsState === "idle" && (
                <>
                  Subscribe
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
              {newsState === "error" && "Try Again"}
            </button>
          </form>
          {newsState === "success" && (
            <p className="text-xs text-emerald-400 font-mono animate-pulse">
              🎉 Success! You've been subscribed to the newsletter.
            </p>
          )}
          {newsState === "error" && (
            <p className="text-xs text-rose-400 font-mono">
              ⚠️ Please enter a valid email address.
            </p>
          )}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[40px] p-12 md:p-20 text-center space-y-8 shadow-2xl shadow-purple-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Ready to bring your <br /> stories to life?
          </h2>
          <p className="text-purple-100 text-lg md:text-xl font-medium max-w-xl mx-auto opacity-80">
            Join thousands of creators using Sonikoma to make comic videos
            faster and easier than ever.
          </p>
          <div className="pt-4">
            <button
              onClick={onGetStarted}
              className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-neutral-100 transition-all shadow-xl text-lg active:scale-95 cursor-pointer"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <LandingFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="p-8 rounded-[32px] bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-800/50 transition-all group">
      <div
        className={`mb-6 p-4 rounded-2xl bg-neutral-800 border border-white/5 inline-flex ${color} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-6 group">
      <div className="text-4xl font-black text-neutral-800 group-hover:text-purple-500/50 transition-colors">
        {num}
      </div>
      <div className="space-y-1">
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  desc,
  features,
  excludedFeatures,
  isPopular = false,
  btnText,
  onClick,
}: {
  title: string;
  price: number;
  desc: string;
  features: string[];
  excludedFeatures: string[];
  isPopular?: boolean;
  btnText: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-8 rounded-[32px] bg-neutral-900/50 border transition-all flex flex-col justify-between relative group ${
        isPopular
          ? "border-purple-500 bg-neutral-900/80 shadow-xl shadow-purple-650/5"
          : "border-white/5 hover:border-white/10"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
          Most Popular
        </span>
      )}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            {desc}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">${price}</span>
          <span className="text-neutral-500 text-sm font-medium">/month</span>
        </div>
        <div className="border-t border-white/5 pt-6 space-y-4">
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-neutral-300"
              >
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
            {excludedFeatures.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-neutral-600"
              >
                <span className="w-4 h-4 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  -
                </span>
                <span className="line-through">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full mt-8 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 cursor-pointer ${
          isPopular
            ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-650/20"
            : "bg-neutral-805 border border-white/5 text-neutral-200 hover:bg-neutral-700 hover:text-white"
        }`}
      >
        {btnText}
      </button>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  handle,
  rating,
  role,
  avatar,
}: {
  quote: string;
  author: string;
  handle: string;
  rating: number;
  role: string;
  avatar: string;
}) {
  return (
    <div className="p-8 rounded-[32px] bg-neutral-900/40 border border-white/5 hover:border-white/10 hover:bg-neutral-800/40 transition-all flex flex-col justify-between space-y-6">
      <p className="text-neutral-300 text-sm leading-relaxed italic">
        "{quote}"
      </p>
      <div className="flex items-center gap-4 border-t border-white/5 pt-4">
        <img
          src={avatar}
          alt={author}
          className="w-12 h-12 rounded-2xl object-cover bg-neutral-800 border border-white/10"
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-neutral-100">{author}</span>
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: rating }).map((_, i) => (
                <Sparkles
                  key={i}
                  className="w-3 h-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col text-[10px] text-neutral-500">
            <span className="font-mono text-purple-400">{handle}</span>
            <span>{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlicingBefore() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 space-y-6 bg-neutral-950 overflow-y-auto scrollbar-thin">
      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 border-b border-white/5 w-full pb-2 text-center">
        Raw Vertical Strip Layout
      </div>
      <div className="w-48 h-32 rounded-xl bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)]" />
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 animate-pulse" />
      </div>
      <div className="w-48 h-40 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]" />
        <div className="w-12 h-24 bg-white/5 rounded-lg border border-white/10" />
      </div>
      <div className="w-48 h-36 rounded-xl bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.2),transparent_70%)]" />
        <div className="w-20 h-10 bg-white/5 rounded border border-white/10" />
      </div>
    </div>
  );
}

function SlicingAfter() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 space-y-6 bg-neutral-950 overflow-y-auto scrollbar-thin">
      <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-500/10 w-full pb-2 text-center">
        Detected Bounding Boxes
      </div>
      <div className="w-48 h-32 rounded-xl bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center border border-purple-500 relative overflow-hidden shrink-0 shadow-lg shadow-purple-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)]" />
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 01 (99.8%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[8px]">
          x:0, y:0, w:192, h:128
        </div>
      </div>
      <div className="w-48 h-40 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-900 flex items-center justify-center border border-emerald-500 relative overflow-hidden shrink-0 shadow-lg shadow-emerald-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]" />
        <div className="w-12 h-24 bg-white/5 rounded-lg border border-white/10" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 02 (99.4%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-emerald-300 font-mono text-[8px]">
          x:0, y:152, w:192, h:160
        </div>
      </div>
      <div className="w-48 h-36 rounded-xl bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center border border-indigo-500 relative overflow-hidden shrink-0 shadow-lg shadow-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.2),transparent_70%)]" />
        <div className="w-20 h-10 bg-white/5 rounded border border-white/10" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 03 (98.9%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-indigo-300 font-mono text-[8px]">
          x:0, y:336, w:192, h:144
        </div>
      </div>
    </div>
  );
}

function BubblesBefore() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      {/* Comic Illustration */}
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        {/* Simple drawing representation */}
        <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-orange-400/80 blur-md" />
        <div className="absolute bottom-0 right-0 w-32 h-44 bg-neutral-800 rounded-t-[50px] border border-white/5" />
        <div className="absolute bottom-36 right-8 w-16 h-16 rounded-full bg-neutral-700" />

        {/* Big speech bubble */}
        <div className="absolute top-8 right-6 bg-white text-black p-4 rounded-[20px] rounded-tr-none shadow-2xl max-w-[150px] border-2 border-black flex flex-col justify-center items-center">
          <p className="text-[10px] font-bold leading-tight text-center font-mono">
            I must destroy this... no matter the cost!
          </p>
          <div className="absolute -right-2 top-0 w-4 h-4 bg-white border-r-2 border-t-2 border-black rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function BubblesAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      {/* Comic Illustration - Clean inpainted */}
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        {/* Simple drawing representation */}
        <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-orange-400/80 blur-md animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-44 bg-neutral-800 rounded-t-[50px] border border-white/5" />
        <div className="absolute bottom-36 right-8 w-16 h-16 rounded-full bg-neutral-700" />
        {/* Speech bubble erased! */}
        <div className="absolute top-8 right-6 w-16 h-16 bg-purple-700/10 blur-xl rounded-full" />
        <div className="absolute top-4 right-10 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-[8px] font-mono font-bold">
          Speech Bubble Cleared
        </div>
      </div>
    </div>
  );
}

function TranslationBefore() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-rose-900 via-purple-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        {/* Simple drawing representation */}
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-neutral-800 rounded-tr-[50px] border border-white/5" />
        <div className="absolute bottom-32 left-10 w-16 h-16 rounded-full bg-neutral-700" />

        {/* Korean bubble */}
        <div className="absolute top-10 right-6 bg-white text-black p-4 rounded-[20px] rounded-tl-none shadow-2xl max-w-[150px] border-2 border-black">
          <p className="text-xs font-black leading-tight text-center">
            그 누구도 내 앞길을 막을 수 없다!
          </p>
          <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function TranslationAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-rose-900 via-purple-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        {/* Simple drawing representation */}
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-neutral-800 rounded-tr-[50px] border border-white/5" />
        <div className="absolute bottom-32 left-10 w-16 h-16 rounded-full bg-neutral-700" />

        {/* English typeset bubble */}
        <div className="absolute top-10 right-6 bg-white text-black p-4 rounded-[20px] rounded-tl-none shadow-2xl max-w-[150px] border-2 border-black">
          <p className="text-[10px] font-black leading-none text-center font-sans tracking-tight">
            NO ONE CAN STAND IN MY WAY!
          </p>
          <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45 pointer-events-none" />
        </div>

        <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-[8px] font-mono font-bold">
          Typeset Auto-Translated (EN)
        </div>
      </div>
    </div>
  );
}

function CinematicRenderDemo({ onGetStarted }: { onGetStarted: () => void }) {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [audioStyle, setAudioStyle] = React.useState("Aiden - Epic Trailer");
  const [musicTheme, setMusicTheme] = React.useState("Cyberpunk Synthwave");
  const [aspect, setAspect] = React.useState("9:16 Vertical");

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-550" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-neutral-400 ml-2">
            Cinematic Render Studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-neutral-900 border border-white/5 rounded text-[10px] font-mono text-neutral-400">
            Export: {aspect}
          </span>
          <button
            onClick={onGetStarted}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Export MP4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Storyboard Panel Queue */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
            Timeline Panels
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
            {[
              { id: 1, duration: "3.5s", active: true, title: "Panel 01" },
              { id: 2, duration: "4.2s", active: false, title: "Panel 02" },
              { id: 3, duration: "3.8s", active: false, title: "Panel 03" },
            ].map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  p.active
                    ? "bg-purple-650/10 border-purple-500/40 text-white"
                    : "bg-neutral-900/60 border-white/5 text-neutral-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.active ? "bg-purple-500 animate-ping" : "bg-neutral-600"
                    }`}
                  />
                  <span className="text-xs font-bold font-mono">{p.title}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {p.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Live Video Player Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
            Viewport Canvas
          </h4>
          <div className="relative aspect-video w-full rounded-2xl border border-white/5 bg-neutral-900 overflow-hidden flex items-center justify-center group">
            {/* Simulated Pan-and-Zoom Image */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
                isPlaying
                  ? "scale-110 translate-x-1 translate-y-1 animate-pulse"
                  : "scale-100"
              }`}
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')`,
                opacity: 0.7,
              }}
            />

            {/* Subtitles Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 border border-white/5 backdrop-blur-md rounded-xl text-center text-xs font-bold text-white shadow-lg">
              "NO ONE CAN STAND IN MY WAY!"
            </div>

            {/* Control HUD overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer"
              >
                {isPlaying ? (
                  <span className="font-bold text-xs">PAUSE</span>
                ) : (
                  <Play className="w-6 h-6 fill-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audio & Render Settings */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
            Audio & Render Settings
          </h4>
          <div className="space-y-3 bg-neutral-900/60 p-4 rounded-2xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-mono">
                Narrator Voice
              </label>
              <select
                value={audioStyle}
                onChange={(e) => setAudioStyle(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 text-xs text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-purple-500"
              >
                <option>Aiden - Epic Trailer</option>
                <option>Lily - Emotional</option>
                <option>Gideon - Deep Anime</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-mono">
                Music Track
              </label>
              <select
                value={musicTheme}
                onChange={(e) => setMusicTheme(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 text-xs text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-purple-500"
              >
                <option>Cyberpunk Synthwave</option>
                <option>Medieval Orchestral</option>
                <option>Lo-Fi Chill Beat</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-mono">
                Aspect Ratio
              </label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 text-xs text-neutral-100 rounded-lg p-2 focus:outline-none focus:border-purple-500"
              >
                <option>9:16 Vertical</option>
                <option>16:9 Landscape</option>
                <option>1:1 Square</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Waveform Panel */}
      <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-neutral-100">TTS Sync Wave</div>
            <div className="text-[9px] font-mono text-neutral-500">
              Audio track synchronized with Panel #1
            </div>
          </div>
        </div>

        {/* Animated wave bars */}
        <div className="flex items-center gap-1 h-6 shrink-0">
          {[
            8, 14, 20, 12, 6, 16, 24, 18, 10, 4, 12, 22, 14, 8, 16, 20, 10, 6,
          ].map((h, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full bg-purple-550 transition-all duration-300 ${
                isPlaying ? "animate-pulse" : ""
              }`}
              style={{
                height: isPlaying ? `${h}px` : "4px",
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="py-20 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-650 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">
              Sonikoma
            </span>
          </div>
          <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
            Revolutionizing the way Webtoons are consumed. We empower creators
            to bridge the gap between static panels and dynamic cinema.
          </p>
          <div className="flex items-center gap-4">
            <FooterSocial icon={<Twitter />} />
            <FooterSocial icon={<Youtube />} />
            <FooterSocial icon={<Github />} />
          </div>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-neutral-400">
            Product
          </h5>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Showcase
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                API Docs
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Enterprise
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-neutral-400">
            Company
          </h5>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-20 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-neutral-600 text-xs font-mono">
          &copy; 2026 Sonikoma Technologies. All rights reserved.
        </p>
        <p className="text-neutral-700 text-[10px] uppercase font-black tracking-widest">
          Built for the future of comics
        </p>
      </div>
    </footer>
  );
}

function FooterSocial({ icon }: { icon: React.ReactElement<any> }) {
  return (
    <a
      href="#"
      className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-850 transition-all cursor-pointer"
    >
      {React.cloneElement(icon, { size: 18 })}
    </a>
  );
}

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
  Globe
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-600">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">Anivox</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2.5 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-white text-black text-sm font-black rounded-xl hover:bg-neutral-200 transition-all shadow-lg active:scale-95"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Webtoon Transformation
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
            Turn Comics into <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400">Cinematic Masterpieces</span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Anivox uses advanced AI to scrape, slice, and compile your favorite Webtoons into immersive videos with dynamic motion, TTS, and professional editing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-purple-600/30 flex items-center justify-center gap-3 text-lg group"
            >
              Start Creating Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-lg">
              <Play className="w-6 h-6 fill-white" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Supercharged Workflow</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">Everything you need to automate your content creation pipeline from start to finish.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="Smart Scraper"
              description="Instantly fetch entire chapters from any major Webtoon platform with one click."
              color="text-blue-400"
            />
            <FeatureCard
              icon={<Scissors className="w-8 h-8" />}
              title="AI Auto-Slicer"
              description="Intelligent panel detection automatically cuts vertical strips into individual high-res frames."
              color="text-purple-400"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Bubble Removal"
              description="Clear away speech bubbles using computer vision to prepare clean assets for animation."
              color="text-emerald-400"
            />
            <FeatureCard
              icon={<Layers className="w-8 h-8" />}
              title="Narrative AI"
              description="Generate rich scripts, character profiles, and translations using Gemini 2.0 Flash."
              color="text-orange-400"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Cinematic Motion"
              description="Apply professional camera pans, zooms, and transitions to static comic panels."
              color="text-rose-400"
            />
            <FeatureCard
              icon={<Video className="w-8 h-8" />}
              title="1-Click Export"
              description="Compile your storyboard into high-quality MP4 videos ready for YouTube and TikTok."
              color="text-indigo-400"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-5xl font-black tracking-tighter">Simple 3-Step Process</h2>

            <div className="space-y-8">
              <Step
                num="01"
                title="Paste your URL"
                desc="Copy the link to your favorite Webtoon chapter and let our engine handle the rest."
              />
              <Step
                num="02"
                title="AI Enhancement"
                desc="Our AI detects panels, extracts text, generates TTS, and applies cinematic motion automatically."
              />
              <Step
                num="03"
                title="Export & Share"
                desc="Preview your creation in real-time and export a high-quality video for your audience."
              />
            </div>
          </div>

          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
             <div className="relative bg-neutral-900 border border-white/10 rounded-[32px] overflow-hidden aspect-video shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[40px] p-12 md:p-20 text-center space-y-8 shadow-2xl shadow-purple-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">Ready to bring your <br/> stories to life?</h2>
          <p className="text-purple-100 text-lg md:text-xl font-medium max-w-xl mx-auto opacity-80">
            Join thousands of creators using Anivox to automate their comic-to-video production pipeline.
          </p>
          <div className="pt-4">
            <button
              onClick={onGetStarted}
              className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-neutral-100 transition-all shadow-xl text-lg active:scale-95"
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

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="p-8 rounded-[32px] bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-800/50 transition-all group">
      <div className={`mb-6 p-4 rounded-2xl bg-neutral-800 border border-white/5 inline-flex ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="text-4xl font-black text-neutral-800 group-hover:text-purple-500/50 transition-colors">{num}</div>
      <div className="space-y-1">
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
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
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">Anivox</span>
          </div>
          <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
            Revolutionizing the way Webtoons are consumed. We empower creators to bridge the gap between static panels and dynamic cinema.
          </p>
          <div className="flex items-center gap-4">
            <FooterSocial icon={<Twitter />} />
            <FooterSocial icon={<Youtube />} />
            <FooterSocial icon={<Github />} />
          </div>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-neutral-400">Product</h5>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Showcase</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Enterprise</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-neutral-400">Company</h5>
          <ul className="space-y-4 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-20 flex flex-col md:row items-center justify-between gap-6">
        <p className="text-neutral-600 text-xs font-mono">&copy; 2025 Anivox Technologies. All rights reserved.</p>
        <p className="text-neutral-700 text-[10px] uppercase font-black tracking-widest">Built for the future of comics</p>
      </div>
    </footer>
  );
}

function FooterSocial({ icon }: { icon: React.ReactElement<any> }) {
  return (
    <a href="#" className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
      {React.cloneElement(icon, { size: 18 })}
    </a>
  );
}

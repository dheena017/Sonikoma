import React, { useState } from "react";
import {
  AlertTriangle,
  RotateCw,
  Search,
  Globe,
  Upload,
  BookOpen,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface WebtoonConnectionErrorCardProps {
  errorMessage?: string | null;
  targetUrl?: string;
  onRetry: (url?: string) => void;
  onNavigateHome?: () => void;
}

export default function WebtoonConnectionErrorCard({
  errorMessage,
  targetUrl,
  onRetry,
  onNavigateHome,
}: WebtoonConnectionErrorCardProps) {
  const [retryUrl, setRetryUrl] = useState(targetUrl || "");
  const [isRetrying, setIsRetrying] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retryUrl.trim()) return;
    setIsRetrying(true);
    onRetry(retryUrl.trim());
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const handleLoadDemo = () => {
    localStorage.setItem("auto_import_url", "https://www.webtoons.com/sample/solo-leveling");
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav("/scraper");
    else {
      window.history.pushState({}, "", "/scraper");
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handleGoToDashboard = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav("/dashboard");
    else {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-rose-500/20 bg-gradient-to-b from-[#1E1215] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8 relative overflow-hidden text-left animate-fade-in">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono mb-1">
              <AlertTriangle className="w-3 h-3" />
              Source Connection Error
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Unable to Fetch Webtoon Series
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoToDashboard}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* DIAGNOSTIC EXPLANATION BOX */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 space-y-3 relative z-10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-200">
              {errorMessage || "Webtoon connection error: The requested comic source returned 'Connect Error :: WEBTOON'."}
            </h4>
            <p className="text-xs text-rose-300/80 leading-relaxed font-sans">
              The external webtoon server blocked or could not resolve the requested series identifier. This commonly happens when:
            </p>
            <ul className="text-xs text-[#9CA3AF] list-disc list-inside space-y-1 pt-1 font-mono">
              <li>The URL or series ID is incomplete or mistyped.</li>
              <li>The source website has active Cloudflare / anti-crawler protection.</li>
              <li>The series or chapter has been deleted, renamed, or region-locked.</li>
            </ul>
          </div>
        </div>

        {targetUrl && (
          <div className="pt-2 border-t border-rose-500/10 flex items-center gap-2 text-xs font-mono text-[#9CA3AF] truncate">
            <span className="text-[#6B7280]">Target:</span>
            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-rose-300 truncate max-w-md">
              {targetUrl}
            </span>
          </div>
        )}
      </div>

      {/* ACTIONABLE SOLUTIONS GRID */}
      <div className="space-y-4 relative z-10">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Recommended Solutions
        </h3>

        {/* Option 1: URL Retry Input */}
        <form onSubmit={handleFormSubmit} className="space-y-2">
          <label className="text-xs text-[#9CA3AF] font-medium block">
            1. Try with a Direct Webtoon/Manga Series URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="https://www.webtoons.com/en/fantasy/..."
                value={retryUrl}
                onChange={(e) => setRetryUrl(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/[0.1] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-[#6B7280] outline-none font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isRetrying || !retryUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-white/[0.04] disabled:text-[#6B7280] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry Fetch</span>
            </button>
          </div>
        </form>

        {/* Option 2 & 3: Alternative Workflows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Upload Manually */}
          <button
            type="button"
            onClick={() => {
              const nav = (window as any).navigateTo;
              if (typeof nav === "function") nav("/scraper");
              else {
                window.history.pushState({}, "", "/scraper");
                window.dispatchEvent(new Event("popstate"));
              }
            }}
            className="p-4 rounded-2xl border border-white/[0.08] bg-[#161616] hover:bg-[#1C1C1C] hover:border-purple-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Upload Manga Manually
              </h4>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Drag and drop raw comic images or a `.zip` archive directly without scraping.
            </p>
          </button>

          {/* Try Demo Series */}
          <button
            type="button"
            onClick={handleLoadDemo}
            className="p-4 rounded-2xl border border-white/[0.08] bg-[#161616] hover:bg-[#1C1C1C] hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Explore Demo Series
              </h4>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Open a pre-loaded sample chapter to test the OCR, voice, and video studio tools.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

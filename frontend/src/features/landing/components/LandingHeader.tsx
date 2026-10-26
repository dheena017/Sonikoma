import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Volume2,
  Palette,
  Scale,
  Star,
  Sun,
  Moon,
  ArrowRight,
  Loader2,
  Layers,
  ListOrdered,
  PlayCircle,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

export interface LandingHeaderProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isNavigating?: boolean;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
}

export function LandingHeader({
  onGetStarted,
  onLogin,
  isNavigating = false,
  themeMode = "dark",
  toggleThemeMode,
}: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const isLight = themeMode === "light";

  // Close explore dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exploreRef.current &&
        !exploreRef.current.contains(event.target as Node)
      ) {
        setIsExploreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToTarget = (targetId: string) => {
    setIsExploreOpen(false);
    setIsMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById("landing-scroll-area");
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const exploreItems = [
    {
      id: "voice-studio",
      label: "Voice Studio",
      sublabel: "Audition neural character voice actors",
      icon: <Volume2 className="w-4 h-4 text-blue-400" />,
      iconBg: isLight ? "bg-blue-100" : "bg-blue-500/15",
    },
    {
      id: "genre-gallery",
      label: "Genre Gallery",
      sublabel: "Explore comic genres & visual styles",
      icon: <Palette className="w-4 h-4 text-blue-400" />,
      iconBg: isLight ? "bg-blue-100" : "bg-blue-500/15",
    },
    {
      id: "comparison",
      label: "Comparison",
      sublabel: "Manual video editing vs Sonikoma",
      icon: <Scale className="w-4 h-4 text-blue-400" />,
      iconBg: isLight ? "bg-blue-100" : "bg-blue-500/15",
    },
    {
      id: "testimonials",
      label: "Creator Reviews",
      sublabel: "See what manga & webtoon creators say",
      icon: <Star className="w-4 h-4 text-blue-400" />,
      iconBg: isLight ? "bg-blue-100" : "bg-blue-500/15",
    },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 flex-shrink-0 ${
        isLight
          ? "bg-white/95 border-slate-200/90 shadow-sm"
          : "bg-[#0a0b0e]/95 border-[#2F2F2F] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="shrink-0 flex items-center">
          <SonikomaLogo
            size="md"
            showSubtitle={true}
            subtitleText="Comic to Video AI"
            onClick={scrollToTop}
          />
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
          {/* Features */}
          <Tooltip text="Explore core AI capabilities" placement="bottom">
            <button
              onClick={() => scrollToTarget("features")}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Features
            </button>
          </Tooltip>

          {/* How It Works */}
          <Tooltip text="Learn how Sonikoma works in 5 steps" placement="bottom">
            <button
              onClick={() => scrollToTarget("how-it-works")}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              How It Works
            </button>
          </Tooltip>

          {/* Live Demo */}
          <Tooltip text="Interactive transformation preview" placement="bottom">
            <button
              onClick={() => scrollToTarget("demo-showcase")}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Live Demo
            </button>
          </Tooltip>

          {/* Explore Dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => setIsExploreOpen((prev) => !prev)}
              onMouseEnter={() => setIsExploreOpen(true)}
              aria-expanded={isExploreOpen}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isExploreOpen
                  ? isLight
                    ? "bg-slate-100 text-blue-600"
                    : "bg-white/10 text-white"
                  : isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Explore</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExploreOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isExploreOpen && (
              <div
                onMouseLeave={() => setIsExploreOpen(false)}
                className={`absolute top-full left-0 mt-2 w-72 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95 z-50 ${
                  isLight
                    ? "bg-white/95 border-slate-200 shadow-slate-300/50"
                    : "bg-[#11131a]/95 border-white/10 shadow-black/80"
                }`}
              >
                {exploreItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToTarget(item.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer group ${
                      isLight
                        ? "hover:bg-slate-100 text-slate-800"
                        : "hover:bg-white/5 text-neutral-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-tight group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          isLight ? "text-slate-500" : "text-neutral-400"
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <Tooltip text="View pricing plans & credits" placement="bottom">
            <button
              onClick={() => scrollToTarget("pricing")}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Pricing
            </button>
          </Tooltip>

          {/* FAQ */}
          <Tooltip text="Frequently asked questions" placement="bottom">
            <button
              onClick={() => scrollToTarget("faq")}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                isLight
                  ? "text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              }`}
            >
              FAQ
            </button>
          </Tooltip>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Optional Theme Mode Switch */}
          {toggleThemeMode && (
            <Tooltip
              text={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              placement="bottom"
            >
              <button
                onClick={toggleThemeMode}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                    : "bg-[#141414] border-[#2F2F2F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white"
                }`}
                aria-label="Toggle theme mode"
              >
                {isLight ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-blue-400" />
                )}
              </button>
            </Tooltip>
          )}

          {/* Subtle Divider */}
          <div
            className={`hidden sm:block h-5 w-px ${
              isLight ? "bg-slate-200" : "bg-white/10"
            }`}
          />

          {/* Sign In */}
          <Tooltip text="Log in to your Sonikoma account" placement="bottom">
            <button
              disabled={isNavigating}
              onClick={onLogin}
              className={`hidden sm:inline-flex items-center justify-center h-10 px-4 text-sm font-semibold transition-all duration-200 cursor-pointer rounded-xl select-none focus:outline-none border border-transparent ${
                isLight
                  ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  : "bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white"
              }`}
            >
              Sign In
            </button>
          </Tooltip>

          {/* Get Started Free CTA */}
          <Tooltip text="Start creating comic videos for free" placement="bottom">
            <button
              disabled={isNavigating}
              onClick={onGetStarted}
              className="group relative h-10 px-4 sm:px-5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer select-none focus:outline-none inline-flex items-center justify-center gap-2"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </Tooltip>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-[#141414] border-[#2F2F2F] text-neutral-300 hover:bg-[#2A2A2A]"
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden border-t px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
            isLight
              ? "bg-white border-slate-200 text-slate-900 shadow-xl"
              : "bg-[#0d0e12] border-[#2F2F2F] text-white shadow-2xl"
          }`}
        >
          {/* Main sections */}
          <div className="space-y-1">
            <div
              className={`px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                isLight ? "text-slate-400" : "text-neutral-500"
              }`}
            >
              Main Navigation
            </div>
            {[
              {
                label: "Features",
                target: "features",
                icon: <Layers className="w-4 h-4" />,
              },
              {
                label: "How It Works",
                target: "how-it-works",
                icon: <ListOrdered className="w-4 h-4" />,
              },
              {
                label: "Live Demo",
                target: "demo-showcase",
                icon: <PlayCircle className="w-4 h-4" />,
              },
              {
                label: "Pricing",
                target: "pricing",
                icon: <CreditCard className="w-4 h-4" />,
              },
              {
                label: "FAQ",
                target: "faq",
                icon: <HelpCircle className="w-4 h-4" />,
              },
            ].map((link) => (
              <button
                key={link.target}
                onClick={() => scrollToTarget(link.target)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-slate-100 text-slate-700"
                    : "hover:bg-white/5 text-neutral-300"
                }`}
              >
                <span className="text-neutral-400">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {/* Explore Features */}
          <div className="space-y-1 pt-2 border-t border-[#2F2F2F]/20">
            <div
              className={`px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                isLight ? "text-slate-400" : "text-neutral-500"
              }`}
            >
              Explore Showcase
            </div>
            {exploreItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToTarget(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "hover:bg-slate-100 text-slate-700"
                    : "hover:bg-white/5 text-neutral-300"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-[#2F2F2F]/30 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogin();
              }}
              className={`w-full h-11 rounded-xl text-sm font-semibold transition-colors cursor-pointer border flex items-center justify-center ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                  : "bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white"
              }`}
            >
              Sign In
            </button>

            <button
              disabled={isNavigating}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onGetStarted();
              }}
              className="w-full h-11 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

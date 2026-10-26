import React, { useState } from "react";
import { useLandingPage } from "../hooks";
import {
  LandingHeader,
  LandingHero,
  MetricsBanner,
  CreatorStorySection,
  FeatureGrid,
  HowItWorksSection,
  LiveDemoSection,
  VoiceStudioShowcase,
  MotionShowcase,
  GenreGallery,
  CreativeControlSection,
  ComparisonSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  CtaBanner,
  LandingFooter,
} from "../components";
import type { LandingPageProps } from "../types";

export function LandingPage({
  onGetStarted,
  onLogin,
  themeMode = "dark",
  toggleThemeMode,
}: LandingPageProps) {
  const [isNavigating, setIsNavigating] = useState(false);

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

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-300 selection:bg-blue-500 selection:text-white ${
        isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0a0b0e] text-neutral-100"
      }`}
    >
      {/* 1. Global Navigation Header */}
      <LandingHeader
        onGetStarted={() => handleAction(onGetStarted)}
        onLogin={() => handleAction(onLogin)}
        isNavigating={isNavigating}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
      />

      {/* 2. Scrollable Body */}
      <div
        id="landing-scroll-area"
        className={`custom-scrollbar flex-1 overflow-y-auto relative ${
          isLight ? "bg-[#f8fafc]" : "bg-[#0a0b0e]"
        }`}
      >
        {/* Hero Section with Chapter URL Input & Platform Detection */}
        <LandingHero
          themeMode={themeMode}
          landingUrl={landingUrl}
          setLandingUrl={setLandingUrl}
          onGetStarted={() => handleAction(onGetStarted)}
          isNavigating={isNavigating}
        />

        {/* Metrics & Supported Platforms Banner */}
        <MetricsBanner themeMode={themeMode} />

        {/* Creator Story Narrative ("From page to playback") */}
        <CreatorStorySection themeMode={themeMode} />

        {/* Core AI Capabilities Grid */}
        <FeatureGrid
          themeMode={themeMode}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Autonomous 5-Step Pipeline */}
        <HowItWorksSection themeMode={themeMode} />

        {/* Interactive Live Transformation Preview */}
        <LiveDemoSection
          themeMode={themeMode}
          demoTab={demoTab}
          setDemoTab={setDemoTab}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Neural Character Voice Studio Showcase */}
        <VoiceStudioShowcase
          themeMode={themeMode}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Cinematic 2.5D Camera Motion Showcase */}
        <MotionShowcase
          themeMode={themeMode}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Comic Genres & Art Gallery */}
        <GenreGallery
          themeMode={themeMode}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Creative Direction & Control */}
        <CreativeControlSection themeMode={themeMode} />

        {/* Workflow Comparison */}
        <ComparisonSection
          themeMode={themeMode}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Creator Reviews & Testimonials */}
        <TestimonialsSection themeMode={themeMode} />

        {/* Transparent Pricing Plans */}
        <PricingSection
          themeMode={themeMode}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* FAQ Accordion */}
        <FaqSection
          themeMode={themeMode}
          openFaq={openFaq}
          toggleFaq={toggleFaq}
        />

        {/* Final Call to Action */}
        <CtaBanner
          themeMode={themeMode}
          isNavigating={isNavigating}
          onGetStarted={() => handleAction(onGetStarted)}
        />

        {/* Global Landing Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}

export default LandingPage;

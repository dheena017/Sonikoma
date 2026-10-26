import React from "react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { PricingCard } from "./PricingCard";
import type { ThemeMode, BillingCycle } from "../types";

export interface PricingSectionProps {
  themeMode?: ThemeMode;
  billingCycle: BillingCycle;
  setBillingCycle: (cycle: BillingCycle) => void;
  onGetStarted: () => void;
}

export function PricingSection({
  themeMode = "dark",
  billingCycle,
  setBillingCycle,
  onGetStarted,
}: PricingSectionProps) {
  const isLight = themeMode === "light";

  return (
    <section
      id="pricing"
      className={`py-24 px-6 scroll-mt-24 relative z-10 ${
        isLight
          ? "bg-slate-100/70 border-y border-slate-200"
          : "bg-[#0d0e12] border-y border-[#2F2F2F]"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
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
            <Tooltip
              text="Switch between monthly and yearly billing (Save 20%)"
              placement="top"
            >
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
  );
}

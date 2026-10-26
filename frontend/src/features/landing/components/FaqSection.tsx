import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FAQS } from "../constants";
import type { ThemeMode } from "../types";

export interface FaqSectionProps {
  themeMode?: ThemeMode;
  openFaq: number | null;
  toggleFaq: (index: number) => void;
}

export function FaqSection({
  themeMode = "dark",
  openFaq,
  toggleFaq,
}: FaqSectionProps) {
  const isLight = themeMode === "light";

  return (
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
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
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
                <div
                  id={`faq-answer-${index}`}
                  hidden={!isOpen}
                  className={`px-5 pb-5 pt-0 text-sm leading-relaxed border-t font-normal transition-colors ${
                    isLight
                      ? "border-slate-100 text-slate-700"
                      : "border-[#2F2F2F] text-neutral-300"
                  }`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

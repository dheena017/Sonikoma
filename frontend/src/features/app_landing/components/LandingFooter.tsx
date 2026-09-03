import React from "react";
import { Twitter, Youtube } from "lucide-react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

function FooterSocial({ icon }: { icon: React.ReactElement<any> }) {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";
  return (
    <a
      href="#"
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
        isLight
          ? "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-200"
          : "bg-[#181818] border-[#2F2F2F] text-neutral-400 hover:text-white hover:bg-[#222]"
      }`}
    >
      {React.cloneElement(icon, { size: 16 })}
    </a>
  );
}

export function LandingFooter() {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";
  return (
    <footer
      className={`py-16 px-6 border-t transition-colors duration-300 ${
        isLight
          ? "border-slate-200 bg-white"
          : "border-[#2F2F2F] bg-[#0D0E12]"
      }`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <img
                src={isLight ? "/logo-light.png" : "/logo-dark.png"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                }}
                className="w-5 h-5 object-contain"
                alt="Sonikoma Logo"
              />
            </div>
            <span
              className={`text-lg font-black tracking-tight uppercase transition-colors ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Sonikoma
            </span>
          </div>
          <p
            className={`text-sm leading-relaxed max-w-sm transition-colors ${
              isLight ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            Turn your favorite webtoon chapters and comics into voiced, animated vertical videos.
          </p>
          <div className="flex items-center gap-2.5 pt-2">
            <FooterSocial icon={<Twitter />} />
            <FooterSocial icon={<Youtube />} />
          </div>
        </div>

        <div>
          <h4
            className={`font-bold text-xs uppercase tracking-wider mb-4 transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Product
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="#features"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#transformation-demo"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Interactive Demo
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4
            className={`font-bold text-xs uppercase tracking-wider mb-4 transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Resources
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                API Reference
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-slate-950 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Community Discord
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-12 mt-12 border-t border-slate-200 dark:border-[#2F2F2F] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className={`text-xs transition-colors ${
            isLight ? "text-slate-600" : "text-neutral-500"
          }`}
        >
          &copy; 2026 Sonikoma Studio. All rights reserved.
        </p>
        <p
          className={`text-xs font-medium transition-colors ${
            isLight ? "text-slate-600" : "text-neutral-500"
          }`}
        >
          Built for vertical comic creators
        </p>
      </div>
    </footer>
  );
}

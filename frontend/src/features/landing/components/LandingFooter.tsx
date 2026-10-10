import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { SonikomaLogo } from "@/shared/ui/branding";

export function LandingFooter() {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";
  return (
    <footer
      className={`py-16 px-6 border-t transition-colors duration-300 ${
        isLight ? "border-slate-200 bg-white" : "border-[#2F2F2F] bg-[#0D0E12]"
      }`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <SonikomaLogo size="sm" />
          <p
            className={`text-sm leading-relaxed max-w-sm transition-colors ${
              isLight ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            Turn your favorite webtoon chapters and comics into voiced, animated
            vertical videos.
          </p>
          <p
            className={`pt-2 text-xs font-semibold tracking-wide transition-colors ${
              isLight ? "text-blue-700" : "text-blue-300"
            }`}
          >
            Made for the stories worth sharing.
          </p>
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
                href="#how-it-works"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#demo-showcase"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Live Preview
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
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
                href="#how-it-works"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Getting started
              </a>
            </li>
            <li>
              <a
                href="#demo-showcase"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Explore the workflow
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className={`transition-colors duration-200 cursor-pointer ${
                  isLight
                    ? "text-slate-700 hover:text-blue-600 font-medium"
                    : "text-neutral-400 hover:text-white font-medium"
                }`}
              >
                Help & FAQs
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

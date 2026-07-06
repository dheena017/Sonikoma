import React from "react";
import { Github, Twitter, Youtube } from "lucide-react";
import { useThemeMode } from "../../../hooks/useThemeMode";

function FooterSocial({ icon }: { icon: React.ReactElement<any> }) {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";
  return (
    <a
      href="#"
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
        isLight
          ? "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          : "bg-neutral-900 border-white/5 text-neutral-500 hover:text-white hover:bg-neutral-800"
      }`}
    >
      {React.cloneElement(icon, { size: 18 })}
    </a>
  );
}

export function LandingFooter() {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";
  return (
    <footer className={`py-20 px-6 border-t transition-colors duration-300 ${
      isLight ? "border-slate-200 bg-white" : "border-white/5 bg-neutral-950/20"
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src={isLight ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="w-8 h-8 rounded-lg bg-white"
              alt="Sonikoma Logo"
            />
            <span className={`text-lg font-black tracking-tighter uppercase transition-colors ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              Sonikoma
            </span>
          </div>
          <p className={`text-sm leading-relaxed transition-colors ${
            isLight ? "text-slate-600" : "text-neutral-500"
          }`}>
            Turn your favorite comics into fully voiced, animated videos that
            are ready to share.
          </p>
          <div className="flex items-center gap-3">
            <FooterSocial icon={<Github />} />
            <FooterSocial icon={<Twitter />} />
            <FooterSocial icon={<Youtube />} />
          </div>
        </div>

        <div>
          <h4 className={`font-black text-sm uppercase mb-6 transition-colors ${
            isLight ? "text-slate-900" : "text-white"
          }`}>Product</h4>
          <ul className={`space-y-3 text-sm transition-colors ${
            isLight ? "text-slate-500" : "text-neutral-500"
          }`}>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={`font-black text-sm uppercase mb-6 transition-colors ${
            isLight ? "text-slate-900" : "text-white"
          }`}>Company</h4>
          <ul className={`space-y-3 text-sm transition-colors ${
            isLight ? "text-slate-500" : "text-neutral-500"
          }`}>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                Blog
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`transition-colors cursor-pointer ${
                  isLight ? "hover:text-slate-900" : "hover:text-white"
                }`}
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-20 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className={`text-xs font-mono transition-colors ${
          isLight ? "text-slate-400" : "text-neutral-600"
        }`}>
          &copy; 2026 Sonikoma Technologies. All rights reserved.
        </p>
        <p className={`text-[10px] uppercase font-black tracking-widest transition-colors ${
          isLight ? "text-slate-400" : "text-neutral-700"
        }`}>
          Built for the future of comics
        </p>
      </div>
    </footer>
  );
}

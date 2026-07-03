import React from "react";
import { Github, Twitter, Youtube } from "lucide-react";

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

export function LandingFooter() {
  return (
    <footer className="py-20 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="w-8 h-8 rounded-lg bg-white"
              alt="Sonikoma Logo"
            />
            <span className="text-lg font-black tracking-tighter uppercase">
              Sonikoma
            </span>
          </div>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Turn your favorite comics into fully voiced, animated videos that are ready to share.
          </p>
          <div className="flex items-center gap-3">
            <FooterSocial icon={<Github />} />
            <FooterSocial icon={<Twitter />} />
            <FooterSocial icon={<Youtube />} />
          </div>
        </div>

        <div>
          <h4 className="font-black text-sm uppercase mb-6">Product</h4>
          <ul className="space-y-3 text-sm text-neutral-500">
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-sm uppercase mb-6">Company</h4>
          <ul className="space-y-3 text-sm text-neutral-500">
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors cursor-pointer">
                Contact
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

"""
Sonikoma Universal Website Button Color Standardization Script
==============================================================
Standardizes buttons across the ENTIRE website:
  1. Primary Buttons: Electric Blue (#3B82F6) with Hover (#2563EB), bold white text & shadow-md shadow-blue-500/25.
  2. Secondary / Standard Buttons (matching uploaded reference):
     - Normal: Dark Surface (#141414) with subtle border (#2F2F2F), white bold text, rounded-xl.
     - Hover: Light Charcoal (#2A2A2A) with border-neutral-500.
"""

import os
import re

frontend_src = r"c:\Users\dheen\project\Sonikoma\frontend\src"

# Specific file-level replacements for Auth & Shell
file_replacements = {
    # ── Auth: LoginForm.tsx ──────────────────────────
    "LoginForm.tsx": [
        (
            "bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 rounded-xl text-white text-xs font-bold"
        ),
        (
            "bg-[#1A1D24] hover:bg-[#232730] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-semibold text-sm",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-bold text-sm"
        ),
        (
            "bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] text-white font-bold py-3.5 rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm",
            "bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
        )
    ],
    # ── Auth: RegisterForm.tsx ───────────────────────
    "RegisterForm.tsx": [
        (
            "bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 rounded-xl text-white text-xs font-bold"
        ),
        (
            "bg-[#1A1D24] hover:bg-[#232730] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-bold text-xs sm:text-sm"
        ),
        (
            "bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm",
            "bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
        )
    ],
    # ── Auth: ForgotPasswordForm.tsx ─────────────────
    "ForgotPasswordForm.tsx": [
        (
            "bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 rounded-xl text-white text-xs font-bold"
        ),
        (
            "bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm",
            "bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer text-sm"
        ),
        (
            "bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm",
            "bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        )
    ],
    # ── Auth: AuthShowcase.tsx ───────────────────────
    "AuthShowcase.tsx": [
        (
            "bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 rounded-xl text-white font-bold"
        )
    ],
    # ── Creative: AgentYouTubeSuccessCard.tsx ────────
    "AgentYouTubeSuccessCard.tsx": [
        (
            "bg-[#181818] hover:bg-[#222] border border-[#2F2F2F]",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F]"
        )
    ],
    # ── Intelligence: ProviderHeroBanner.tsx ─────────
    "ProviderHeroBanner.tsx": [
        (
            "bg-[#181818] hover:bg-[#222]",
            "bg-[#141414] hover:bg-[#2A2A2A]"
        )
    ],
    # ── Platform: DashboardOnboardingGuide.tsx ───────
    "DashboardOnboardingGuide.tsx": [
        (
            "bg-[#141414] hover:bg-[#252525] border border-[#2F2F2F]",
            "bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F]"
        )
    ],
    # ── Platform: SeriesDetailsHeader.tsx ────────────
    "SeriesDetailsHeader.tsx": [
        (
            "bg-[#141414] hover:bg-[#252525]",
            "bg-[#141414] hover:bg-[#2A2A2A]"
        )
    ],
    # ── Intelligence: VisualsTab.tsx ─────────────────
    "VisualsTab.tsx": [
        (
            "bg-[#141414] hover:bg-[#202020]",
            "bg-[#141414] hover:bg-[#2A2A2A]"
        )
    ]
}

def run_standardization():
    print(f"Scanning frontend directory: {frontend_src}")
    total_files = 0
    modified_files = 0

    for root, dirs, files in os.walk(frontend_src):
        for f in files:
            if not f.endswith((".tsx", ".ts", ".css")):
                continue
            total_files += 1
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
            orig = content

            # 1. Apply specific replacements if file matches
            if f in file_replacements:
                for old_val, new_val in file_replacements[f]:
                    content = content.replace(old_val, new_val)

            # 2. General button hover standardizations for subtle dark states:
            # Replace hover:bg-[#252525], hover:bg-[#202020], hover:bg-[#222] on buttons
            if "<button" in content or "btn-" in content:
                content = re.sub(r'hover:bg-\[\#252525\]', 'hover:bg-[#2A2A2A]', content)
                content = re.sub(r'hover:bg-\[\#202020\]', 'hover:bg-[#2A2A2A]', content)
                content = re.sub(r'hover:bg-\[\#222\]', 'hover:bg-[#2A2A2A]', content)

            if content != orig:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                modified_files += 1
                rel_path = os.path.relpath(path, frontend_src)
                print(f"[OK] Standardized buttons in: {rel_path}")

    print(f"\nFinished! Scanned {total_files} files, updated {modified_files} files.")

if __name__ == "__main__":
    run_standardization()

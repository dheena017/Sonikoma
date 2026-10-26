"""
Sonikoma Landing Page Button Color Standardization Script
---------------------------------------------------------
Automates styling for all landing page buttons across:
  - Primary Action Buttons: Brand Electric Blue (#3B82F6) with #2563EB hover and subtle blue glow.
  - Secondary / Standard Buttons (as per uploaded reference):
      * Normal: Surface Dark #141414 with border #2F2F2F and white bold text.
      * Hover: Elevated Light Charcoal (#2A2A2A) with border-neutral-500.
"""

import os

landing_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "features", "landing", "components"))

replacements_by_file = {
    "PricingCard.tsx": [
        (
            'bg-[#0E0E0E] border border-neutral-700/80 text-white hover:bg-neutral-800 hover:border-blue-500/40',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white font-bold shadow-sm'
        ),
        (
            'bg-[#0E0E0E] border border-[#2F2F2F] text-white hover:bg-[#222] hover:border-neutral-600',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white font-bold shadow-sm'
        )
    ],
    "LandingHeader.tsx": [
        (
            'text-neutral-300 hover:text-white hover:bg-white/5 hover:border-white/10',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white'
        ),
        (
            'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-white'
        ),
        (
            'hover:bg-[#222]',
            'hover:bg-[#2A2A2A]'
        )
    ],
    "FeatureGrid.tsx": [
        (
            'bg-blue-500/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-blue-500/25 hover:border-[#3B82F6]',
            'bg-[#141414] hover:bg-[#2A2A2A] text-white border border-[#2F2F2F] hover:border-blue-500/50'
        )
    ],
    "GenreGallery.tsx": [
        (
            'bg-blue-500/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-blue-500/25 hover:border-[#3B82F6]',
            'bg-[#141414] hover:bg-[#2A2A2A] text-white border border-[#2F2F2F] hover:border-blue-500/50'
        )
    ],
    "CreatorStorySection.tsx": [
        (
            'border-blue-500/30 bg-blue-500/10 hover:bg-[#3B82F6] text-blue-400 hover:text-white text-sm font-bold transition-all duration-200 hover:border-[#3B82F6]',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-blue-500/50 text-white text-sm font-bold transition-all duration-200'
        )
    ],
    "LandingHero.tsx": [
        (
            'border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center',
            'bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center justify-center'
        ),
        (
            'hover:bg-[#202020]',
            'hover:bg-[#2A2A2A]'
        )
    ],
    "LiveDemoSection.tsx": [
        (
            'bg-[#181818] text-neutral-300 border border-[#2F2F2F] hover:border-blue-500/40 hover:text-white hover:bg-neutral-800 hover:-translate-y-0.5 shadow-2xs',
            'bg-[#141414] text-white border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 hover:-translate-y-0.5 shadow-sm'
        )
    ]
}

def standardize_buttons():
    print(f"Scanning directory: {landing_dir}")
    modified = 0
    for root, dirs, files in os.walk(landing_dir):
        for f in files:
            if f in replacements_by_file:
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                orig = content
                for old_s, new_s in replacements_by_file[f]:
                    content = content.replace(old_s, new_s)
                if content != orig:
                    with open(path, "w", encoding="utf-8") as file:
                        file.write(content)
                    modified += 1
                    print(f"✓ Updated buttons in: {f}")
                else:
                    print(f"• Already up-to-date: {f}")

    print(f"\nCompleted: {modified} file(s) updated.")

if __name__ == "__main__":
    standardize_buttons()

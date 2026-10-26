# Landing Components (`features/landing/components/`)

## 1. Overview
This directory encapsulates all presentation widgets, interactive workbench sections, and layout blocks for the public landing domain.

## 2. Component Inventory
- `LandingHeader.tsx`: Responsive navigation bar with brand emblem, Explore dropdown, theme toggle, and mobile drawer.
- `LandingHero.tsx`: Above-the-fold hero with interactive omnibar, clipboard paste, sample picker, and platform detection.
- `MetricsBanner.tsx`: High-impact statistics and comic platform support badges.
- `CreatorStorySection.tsx`: Editorial breakdown of comic-to-video creative workflow.
- `FeatureGrid.tsx`: Grid displaying core AI features (slicing, inpainting, dubbing, camera).
- `HowItWorksSection.tsx`: 5-step autonomous comic chapter transformation pipeline.
- `LiveDemoSection.tsx`: Interactive before/after preview workbench.
- `VoiceStudioShowcase.tsx`: Character voice actor audition studio.
- `MotionShowcase.tsx`: 2.5D camera and particle animation showcase.
- `GenreGallery.tsx`: Comic genre style showcase (Action, Romance, Dark Fantasy, Sci-Fi).
- `CreativeControlSection.tsx`: Creative direction and editorial controls.
- `ComparisonSection.tsx`: Side-by-side benchmark comparing manual video editing against Sonikoma.
- `TestimonialsSection.tsx`: Creator ratings and testimonial cards.
- `PricingSection.tsx`: Free, Pro, and Studio pricing tiers with monthly/yearly savings toggle.
- `FaqSection.tsx`: Interactive FAQ accordion.
- `CtaBanner.tsx`: Final call-to-action block.
- `LandingFooter.tsx`: Global footer with navigation links and newsletter subscription.
- `demo/`: Before and after panel comparison subcomponents.

## 3. Export Boundary
All components are publicly re-exported through `components/index.ts`.

# Landing Domain (`features/landing/`)

## 1. Executive Overview & Scope
The **Landing Domain** represents the primary conversion gateway and public presentation portal for Sonikoma. It showcases the comic-to-video AI pipeline, neural voice auditions, genre showcases, workflow comparisons, interactive transformation previews, transparent pricing tiers, and customer testimonials.

## 2. Directory & File Inventory
- **`components/`**:
  - `LandingHeader.tsx`: Responsive navigation header with brand emblem, Explore dropdown, smooth anchor scrolling, theme switch, and mobile drawer.
  - `LandingHero.tsx`: High-converting hero section with interactive omnibar (chapter URL parsing, MangaDex/Webtoon platform detection, clipboard paste, sample picker).
  - `MetricsBanner.tsx`: Quantitative performance proof and platform integration badges.
  - `CreatorStorySection.tsx`: Narrative value proposition and workflow breakdown.
  - `FeatureGrid.tsx`: Core AI capabilities grid (panel segmentation, neural inpainting, voice casting, etc.).
  - `HowItWorksSection.tsx`: Autonomous 5-step comic-to-video pipeline cards.
  - `LiveDemoSection.tsx`: Interactive preview workbench comparing before/after transformation states (slicing, bubbles, translation, render).
  - `VoiceStudioShowcase.tsx`: Neural character actor audition studio with audio wave telemetry and voice presets.
  - `MotionShowcase.tsx`: 2.5D camera pan, shake, and particle VFX demonstrations.
  - `GenreGallery.tsx`: Visual art showcase across Shonen, Otome, Dark Fantasy, and Sci-Fi genres.
  - `CreativeControlSection.tsx`: Fine-grained creative direction feature pillars.
  - `ComparisonSection.tsx`: Side-by-side benchmark of traditional manual video editing vs. Sonikoma AI.
  - `TestimonialsSection.tsx`: Verified webtoon and manga creator reviews and ratings.
  - `PricingSection.tsx`: Pricing plan tiers (Free Starter, Pro Creator, Studio) with monthly/yearly savings toggle.
  - `FaqSection.tsx`: Accessible interactive accordion answering common user inquiries.
  - `CtaBanner.tsx`: High-converting final call-to-action banner.
  - `LandingFooter.tsx`: Global footer with product, resource, legal links, and newsletter subscription form.
  - `demo/`: Specialized before/after preview panels and cinematic render preview.
- **`pages/`**:
  - `LandingPage.tsx`: Root layout coordinator orchestrating header, hero, feature sections, demo, pricing, FAQ, and footer.
- **`hooks/`**:
  - `useLandingPage.ts`: Controller hook managing demo tab selection, slider position, pending URL state, billing toggle, and FAQ expansion.
  - `useNewsletterForm.ts`: Controller hook managing footer newsletter subscription and validation.
- **`constants/`**:
  - `index.ts`: Static datasets for FAQs, sample comic links, and platform URL detection helpers.
- **`types/`**:
  - `index.ts`: Strongly typed domain contracts (`LandingPageProps`, `BillingCycle`, `DemoTabId`, `FaqItem`, `SampleComic`).

## 3. State Architecture & Reactive Flow
- State is encapsulated inside `useLandingPage()` and localized within feature components.
- Incoming comic URLs from the hero input are cached into `sessionStorage` (`pending_comic_url`) to pre-fill the studio pipeline upon user sign-up or login.

## 4. UI Hierarchy Blueprint
```
LandingPage
├── LandingHeader (Sticky Nav + Explore Dropdown + Mobile Drawer)
└── Scrollable Container (#landing-scroll-area)
    ├── LandingHero (Omnibar + Platform Detector + Sample Picker)
    ├── MetricsBanner
    ├── CreatorStorySection
    ├── FeatureGrid (Core AI Capabilities)
    ├── HowItWorksSection (5-Step Pipeline)
    ├── LiveDemoSection (Before/After Interactive Workbench)
    ├── VoiceStudioShowcase (Neural Voice Audition)
    ├── MotionShowcase (2.5D Camera VFX)
    ├── GenreGallery (Art Showcase)
    ├── CreativeControlSection
    ├── ComparisonSection (Manual vs. AI)
    ├── TestimonialsSection
    ├── PricingSection (Monthly/Yearly Billing)
    ├── FaqSection (Accordion)
    ├── CtaBanner
    └── LandingFooter
```

## 5. Utilities & Constants
- `getDetectedPlatform(url)`: Regex and substring matchers recognizing MangaDex, Webtoon, and Tapas URLs.
- `SAMPLE_URLS`: Pre-configured comic examples for instant user testing.
- `FAQS`: Knowledge base for customer onboarding.

## 6. Routing & Navigation
- Mounted under `/` and `/index.html` via `AppRouter.tsx`.
- Links trigger smooth scroll-into-view behavior targeting specific section element IDs (`features`, `how-it-works`, `demo-showcase`, `voice-studio`, `genre-gallery`, `comparison`, `testimonials`, `pricing`, `faq`).

## 7. Dependencies & Public API
- **Exports**: `LandingPage`, `LandingHeader`, `LandingHero`, `PricingSection`, `FaqSection`, `useLandingPage`, `FAQS`, `SAMPLE_URLS`.
- **Allowed Imports**: `@/shared/ui/branding`, `@/shared/ui/common`, `lucide-react`.

## 8. Testing & Quality Assurance
- Responsive viewport test matrix: Mobile (375px), Tablet (768px), Desktop (1024px, 1280px, 1440px+).
- Verified TypeScript compilation and zero console errors.

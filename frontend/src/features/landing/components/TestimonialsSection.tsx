import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { TestimonialCard } from "./TestimonialCard";

interface TestimonialsSectionProps {
  themeMode?: "dark" | "light";
}

export function TestimonialsSection({
  themeMode = "dark",
}: TestimonialsSectionProps) {
  const isLight = themeMode === "light";

  const testimonials = [
    {
      author: "Alex Rivera",
      handle: "@MangaMotion_Official",
      role: "TikTok Comic Creator (480K followers)",
      avatar: "/testimonial-alex.jpg",
      rating: 5,
      stats: "+320K TikTok Followers in 60 Days",
      quote:
        "Sonikoma cut my production time from 5 hours to literally 8 minutes per chapter. My TikTok watch completion rate tripled overnight because the camera motions and voice acting feel so premium.",
    },
    {
      author: "Hana Takahashi",
      handle: "@TakahashiWebtoons",
      role: "Indie Manhwa Author & Illustrator",
      avatar: "/testimonial-hana.jpg",
      rating: 5,
      stats: "1.4M Views on Debut Reel",
      quote:
        "Seeing my original comic panels voiced and animated with dramatic camera tilts gave me actual goosebumps. It turns static webtoon pages into what feels like a legitimate anime trailer.",
    },
    {
      author: "Marcus Vance",
      handle: "@TheManhwaRecap",
      role: "YouTube Shorts Creator (1.1M Subs)",
      avatar: "/testimonial-marcus.jpg",
      rating: 5,
      stats: "Saved 18 Hours / Week",
      quote:
        "The speech bubble inpainting is ridiculously clean. Even over complex watercolor backdrops, there is zero blur or artifacting. I can pump out 3 high quality recap shorts every single day now.",
    },
    {
      author: "Sarah Lin",
      handle: "@KWebtoonDaily",
      role: "Manhwa Translator & Streamer",
      avatar: "/testimonial-sarah.jpg",
      rating: 5,
      stats: "99.8% Subtitle Accuracy",
      quote:
        "Translating raw Korean webtoons used to take an entire weekend with manual typing. Sonikoma detects the Korean speech bubbles, translates them to natural English, and generates synced voiceovers on the fly.",
    },
  ];

  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Loved By Creators Worldwide</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Trusted by Comic Creators &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
              Short-Form Storytellers
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Join thousands of webtoon artists, manga influencers, and video publishers
            who use Sonikoma to explode their reach on TikTok, YouTube, and Instagram.
          </p>
        </div>

        {/* TESTIMONIALS 2x2 GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {testimonials.map((t, index) => (
            <TestimonialCard
              key={index}
              quote={t.quote}
              author={t.author}
              handle={t.handle}
              rating={t.rating}
              role={t.role}
              avatar={t.avatar}
              stats={t.stats}
              themeMode={themeMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Sparkles, ArrowRight, Play, Film, Flame } from "lucide-react";

interface GenreGalleryProps {
  themeMode?: "dark" | "light";
  onGetStarted: () => void;
}

const GENRES = [
  {
    title: "Shonen & Dungeon Action",
    tag: "Action / Hunter",
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    image: "/demo-action-hero.jpg",
    description: "Electric lightning auras, dynamic weapon clashes, and intense hunter awakenings.",
    stats: "Top Popularity • 120+ FPS Motion",
    sampleChapter: "Solo Leveling / Overgeared style",
  },
  {
    title: "Imperial & Otome Romance",
    tag: "Romance / Fantasy",
    tagColor: "bg-pink-500/20 text-pink-300 border-pink-400/30",
    image: "/demo-romance.jpg",
    description: "Starlight palace balconies, royal ballroom drama, and emotional character vows.",
    stats: "High Retention • Melodic Narration",
    sampleChapter: "Villainess / Imperial Palace style",
  },
  {
    title: "Dark Fantasy & Monarchs",
    tag: "Dark Fantasy / Lore",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-400/30",
    image: "/demo-monarch.jpg",
    description: "Obsidian thrones, legions of shadow knights, and world-shattering climaxes.",
    stats: "Cinematic Audio • Punch-Zoom Shake",
    sampleChapter: "Omniscient Reader / Monarch style",
  },
  {
    title: "Sci-Fi & Cyberpunk Rain",
    tag: "Cyberpunk / Mecha",
    tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    image: "/demo-cyberpunk.jpg",
    description: "Neon-drenched megacities, laser blades, holographic HUDs, and stealth operatives.",
    stats: "Synthwave Audio • Multi-Language OCR",
    sampleChapter: "Cyberpunk / Edgerunners style",
  },
];

export function GenreGallery({
  themeMode = "dark",
  onGetStarted,
}: GenreGalleryProps) {
  const isLight = themeMode === "light";

  return (
    <section id="genre-gallery" className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Universal Genre Compatibility</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Breathtaking Visuals Across{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-400 to-blue-400">
              Every Webtoon Genre
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Whether your story is an adrenaline-fueled dungeon raid, an emotional
            imperial romance, or a neon dystopian thriller, Sonikoma's motion engine
            preserves the art style with cinematic flair.
          </p>
        </div>

        {/* 4 GENRE CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GENRES.map((genre, index) => (
            <div
              key={index}
              onClick={onGetStarted}
              className={`group relative rounded-[28px] overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between ${
                isLight
                  ? "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:border-blue-400"
                  : "bg-[#11131a] border-white/10 hover:border-white/30 shadow-xl hover:shadow-2xl hover:shadow-blue-950/40"
              }`}
            >
              {/* Image Container with Zoom effect */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                <img
                  src={genre.image}
                  alt={genre.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                />

                {/* Ambient Dark Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1016] via-transparent to-black/40" />

                {/* Genre Tag Pill */}
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${genre.tagColor}`}
                  >
                    {genre.tag}
                  </span>
                </div>

                {/* Floating Play Icon Badge */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </div>

                {/* Bottom stats inside image */}
                <div className="absolute bottom-3 inset-x-3 z-10">
                  <span className="text-[10px] font-mono text-white/90 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                    {genre.stats}
                  </span>
                </div>
              </div>

              {/* Text Description Box */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3
                    className={`text-base font-bold tracking-tight mb-1 transition-colors ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {genre.title}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed ${
                      isLight ? "text-slate-600" : "text-neutral-400"
                    }`}
                  >
                    {genre.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                  <span>Create Video</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

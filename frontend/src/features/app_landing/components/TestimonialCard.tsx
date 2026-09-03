import React from "react";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  handle: string;
  rating: number;
  role: string;
  avatar: string;
  stats?: string;
  themeMode?: "dark" | "light";
}

export function TestimonialCard({
  quote,
  author,
  handle,
  rating,
  role,
  avatar,
  stats,
  themeMode = "dark",
}: TestimonialCardProps) {
  const isLight = themeMode === "light";

  return (
    <div
      className={`p-8 rounded-[32px] border transition-all duration-300 flex flex-col justify-between space-y-6 ${
        isLight
          ? "bg-white border-slate-200 shadow-lg shadow-slate-200/40 hover:border-purple-300 hover:shadow-purple-200/50"
          : "bg-neutral-900/40 border-white/10 hover:border-[#3B82F6]/40 hover:bg-neutral-900/80 shadow-xl shadow-black/20"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(rating)
                    ? "fill-amber-400 text-amber-400"
                    : isLight
                    ? "text-slate-200"
                    : "text-neutral-700"
                }`}
              />
            ))}
          </div>
          {stats && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              {stats}
            </span>
          )}
        </div>

        <p
          className={`text-sm leading-relaxed italic font-medium transition-colors ${
            isLight ? "text-slate-700" : "text-neutral-300"
          }`}
        >
          "{quote}"
        </p>
      </div>

      <div
        className={`flex items-center gap-4 border-t pt-4 transition-colors ${
          isLight ? "border-slate-100" : "border-white/5"
        }`}
      >
        <img
          src={avatar}
          alt={author}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://lh3.googleusercontent.com/a/default-user";
          }}
          className="w-12 h-12 rounded-2xl object-cover bg-purple-600/10 border border-[#3B82F6]/20 shrink-0"
        />
        <div className="space-y-0.5 overflow-hidden">
          <h4
            className={`font-bold text-sm truncate transition-colors ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {author}
          </h4>
          <div className="flex items-center gap-2">
            <p
              className={`text-xs transition-colors ${
                isLight ? "text-purple-600 font-semibold" : "text-[#3B82F6]"
              }`}
            >
              {handle}
            </p>
            <span className={isLight ? "text-slate-300" : "text-neutral-700"}>
              •
            </span>
            <p
              className={`text-xs truncate transition-colors ${
                isLight ? "text-slate-500" : "text-neutral-500"
              }`}
            >
              {role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

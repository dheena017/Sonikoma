import React from "react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  handle: string;
  rating: number;
  role: string;
  avatar: string;
}

export function TestimonialCard({
  quote,
  author,
  handle,
  rating,
  role,
  avatar,
}: TestimonialCardProps) {
  return (
    <div className="p-8 rounded-[32px] bg-neutral-900/40 border border-white/5 hover:border-white/10 hover:bg-neutral-800/40 transition-all flex flex-col justify-between space-y-6">
      <p className="text-neutral-300 text-sm leading-relaxed italic">
        "{quote}"
      </p>
      <div className="flex items-center gap-4 border-t border-white/5 pt-4">
        <img
          src={avatar}
          alt={author}
          className="w-12 h-12 rounded-2xl object-cover bg-neutral-800 border border-white/10"
        />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">{author}</h4>
          <div className="flex items-center gap-2">
            <p className="text-neutral-500 text-xs">{handle}</p>
            <p className="text-yellow-400 text-xs font-mono">
              {"⭐".repeat(Math.round(rating))}
            </p>
          </div>
          <p className="text-neutral-600 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

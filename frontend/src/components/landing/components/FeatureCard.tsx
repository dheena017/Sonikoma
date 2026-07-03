import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  color,
}: FeatureCardProps) {
  return (
    <div className="p-8 rounded-[32px] bg-neutral-900/50 border border-white/5 hover:border-white/10 hover:bg-neutral-800/50 transition-all group">
      <div
        className={`mb-6 p-4 rounded-2xl bg-neutral-800 border border-white/5 inline-flex ${color} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

import React from "react";

interface StepProps {
  num: string;
  title: string;
  desc: string;
}

export function Step({ num, title, desc }: StepProps) {
  return (
    <div className="flex gap-6 group">
      <div className="text-4xl font-black text-neutral-800 group-hover:text-purple-500/50 transition-colors">
        {num}
      </div>
      <div className="space-y-1">
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

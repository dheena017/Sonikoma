import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function SectionTitle({ children, icon }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-px flex-1 bg-neutral-800" />
      <div className="flex items-center gap-1.5 text-neutral-400">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest font-mono whitespace-nowrap">
          {children}
        </span>
      </div>
      <div className="h-px flex-1 bg-neutral-800" />
    </div>
  );
}

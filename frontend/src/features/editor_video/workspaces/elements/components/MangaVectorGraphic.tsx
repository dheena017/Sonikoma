// ─── MangaVectorGraphic ───────────────────────────────────────────────────────
// Canonical location: workspaces/elements/components/MangaVectorGraphic.tsx
// Mathematically rendered Vector SVG manga graphics (Speech bubbles, speed lines, action bursts)

import React from "react";

interface MangaVectorGraphicProps {
  type: string;
  className?: string;
}

export const MangaVectorGraphic: React.FC<MangaVectorGraphicProps> = ({
  type,
  className = "w-full h-24",
}) => {
  switch (type) {
    case "shout-bubble":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="100,5 125,25 155,10 160,35 190,40 175,65 195,85 165,95 150,115 120,105 100,120 85,95 55,115 50,85 15,80 30,55 5,35 40,25 45,5 75,20"
            fill="#ffffff"
            stroke="#18181b"
            strokeWidth="4"
            strokeLinejoin="miter"
          />
          <text x="100" y="65" fill="#18181b" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Impact, sans-serif">
            SHOUT!
          </text>
        </svg>
      );

    case "oval-bubble":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 50 C20 25, 60 15, 100 15 C140 15, 180 25, 180 50 C180 75, 140 85, 100 85 C80 85, 65 88, 45 105 C50 90, 40 85, 20 50 Z"
            fill="#ffffff"
            stroke="#18181b"
            strokeWidth="3.5"
          />
          <text x="100" y="55" fill="#18181b" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            Dialogue...
          </text>
        </svg>
      );

    case "thought-cloud":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 70 A 20 20 0 0 1 60 35 A 25 25 0 0 1 105 25 A 25 25 0 0 1 150 35 A 20 20 0 0 1 160 70 A 20 20 0 0 1 130 85 A 25 25 0 0 1 70 85 A 20 20 0 0 1 50 70 Z"
            fill="#ffffff"
            stroke="#18181b"
            strokeWidth="3.5"
          />
          <circle cx="45" cy="98" r="6" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
          <circle cx="35" cy="110" r="3.5" fill="#ffffff" stroke="#18181b" strokeWidth="2" />
          <text x="105" y="60" fill="#3f3f46" fontSize="11" fontStyle="italic" fontWeight="600" textAnchor="middle">
            (Thinking...)
          </text>
        </svg>
      );

    case "system-box":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="20" width="170" height="80" rx="8" fill="#082f49" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="25" y1="35" x2="175" y2="35" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <text x="100" y="30" fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            [ SYSTEM PROMPT ]
          </text>
          <text x="100" y="65" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            LEVEL UP +1
          </text>
        </svg>
      );

    case "radial-zoom":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="60" r="18" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 28;
            const y1 = 60 + Math.sin(rad) * 28;
            const x2 = 100 + Math.cos(rad) * 90;
            const y2 = 60 + Math.sin(rad) * 90;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 2 === 0 ? "#ffffff" : "#60a5fa"}
                strokeWidth={i % 3 === 0 ? "3" : "1.5"}
                opacity={0.85}
              />
            );
          })}
        </svg>
      );

    case "linear-speed":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {[15, 30, 45, 60, 75, 90, 105].map((y, i) => (
            <line
              key={i}
              x1={i % 2 === 0 ? "10" : "30"}
              y1={y}
              x2={i % 2 === 0 ? "190" : "170"}
              y2={y}
              stroke="#38bdf8"
              strokeWidth={i % 3 === 0 ? "3" : "1.5"}
              strokeDasharray="20 10 40 15"
              opacity={0.8}
            />
          ))}
        </svg>
      );

    case "boom-sfx":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="100,10 120,35 150,20 145,50 185,55 155,80 180,105 140,95 125,115 100,95 75,115 60,95 20,105 45,80 15,55 55,50 50,20 80,35"
            fill="#ef4444"
            stroke="#fef08a"
            strokeWidth="3.5"
          />
          <text x="100" y="72" fill="#ffffff" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="Impact, sans-serif" stroke="#000000" strokeWidth="1">
            BOOM!
          </text>
        </svg>
      );

    case "slash-sfx":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 100 Q 100 40 185 20" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" />
          <path d="M25 105 Q 100 45 175 25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <text x="100" y="55" fill="#f43f5e" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="Impact, sans-serif" transform="rotate(-15 100 55)">
            SLASH!
          </text>
        </svg>
      );

    case "pow-sfx":
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="100,15 120,40 150,30 140,60 175,70 145,90 160,115 125,100 100,115 85,95 50,110 60,85 25,75 55,55 45,25 80,35"
            fill="#eab308"
            stroke="#18181b"
            strokeWidth="3"
          />
          <text x="100" y="75" fill="#18181b" fontSize="26" fontWeight="900" textAnchor="middle" fontFamily="Impact, sans-serif">
            POW!
          </text>
        </svg>
      );

    case "halftone-dots":
    default:
      return (
        <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="halftone-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="4.5" fill="#ffffff" opacity="0.3" />
          </pattern>
          <rect x="10" y="10" width="180" height="100" rx="8" fill="url(#halftone-pattern)" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        </svg>
      );
  }
};

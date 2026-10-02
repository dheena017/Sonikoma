import React from "react";

interface YouTubeOfficialLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Official Google YouTube Brand Icon (Red Rounded-Rectangle Play Button)
 */
export const YouTubeOfficialLogo: React.FC<YouTubeOfficialLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-5 h-3.5",
    md: "w-7 h-5",
    lg: "w-9 h-6.5",
    xl: "w-12 h-8.5",
  };

  const appliedClass = className || sizeClasses[size];

  return (
    <svg
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm ${appliedClass}`}
      aria-label="YouTube"
    >
      <path
        d="M27.42 3.11c-.32-1.2-1.26-2.14-2.46-2.46C22.79 0 14 0 14 0S5.21 0 3.04.65C1.84.97.9 1.91.58 3.11 0 5.29 0 10 0 10s0 4.71.58 6.89c.32 1.2 1.26 2.14 2.46 2.46C5.21 20 14 20 14 20s8.79 0 10.96-.65c1.2-.32 2.14-1.26 2.46-2.46.58-2.18.58-6.89.58-6.89s0-4.71-.58-6.89z"
        fill="#FF0000"
      />
      <polygon points="11.2,14.3 18.5,10 11.2,5.7" fill="#FFFFFF" />
    </svg>
  );
};

export default YouTubeOfficialLogo;

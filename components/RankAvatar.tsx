"use client";

import { useState } from "react";
import { getRankMeta } from "@/lib/ranks";

interface RankAvatarProps {
  rank: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showGlow?: boolean;
  showBadge?: boolean;
  showCharacterName?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
  "2xl": "h-28 w-28 text-3xl",
};

export default function RankAvatar({
  rank,
  size = "md",
  showGlow = false,
  showBadge = false,
  showCharacterName = false,
  className = "",
}: RankAvatarProps) {
  const meta = getRankMeta(rank);
  const [imageError, setImageError] = useState(false);

  const dimension = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Outer Glow container */}
      <div
        className={`relative flex items-center justify-center rounded-full transition duration-200 ${dimension} ${
          ""
        }`}
        style={undefined}
      >
        {/* Avatar Circle */}
        <div
          className={`relative h-full w-full overflow-hidden rounded-full border-2 bg-surface-elevated ${meta.borderColor}`}
        >
          {!imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.image}
              alt={`${meta.character} (${rank})`}
              className="h-full w-full object-cover select-none"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center font-black ${meta.textColor}`}
            >
              {meta.character.charAt(0)}
            </div>
          )}
        </div>

        {/* Small corner badge if requested */}
        {showBadge && (
          <div
            className={`absolute -bottom-1 -right-1 rounded-sm border border-sumi/20 bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${meta.badgeColor}`}
          >
            {meta.rank}
          </div>
        )}
      </div>

      {/* Optional Character and Rank subtitle */}
      {showCharacterName && (
        <div className="mt-2 text-center">
          <p className="text-xs font-bold text-text-primary">{meta.character}</p>
          <p className={`text-[10px] font-medium ${meta.textColor}`}>{meta.characterTitle}</p>
        </div>
      )}
    </div>
  );
}

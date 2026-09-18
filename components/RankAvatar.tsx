"use client";

import { useState } from "react";
import Image from "next/image";
import { getRankMeta } from "@/lib/ranks";

interface RankAvatarProps {
  rank: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showGlow?: boolean;
  showBadge?: boolean;
  showCharacterName?: boolean;
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
  "2xl": "h-28 w-28 text-3xl",
};

const pixelSizes = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
  "2xl": 112,
};

export default function RankAvatar({
  rank,
  size = "md",
  showGlow = false,
  showBadge = false,
  showCharacterName = false,
  className = "",
  priority,
}: RankAvatarProps) {
  const meta = getRankMeta(rank);
  const [imageError, setImageError] = useState(false);

  const dimension = sizeClasses[size] || sizeClasses.md;
  const px = pixelSizes[size] || pixelSizes.md;
  const isPriority = priority ?? (size === "lg" || size === "xl" || size === "2xl");
  const hasGlow = showGlow && meta.glowColor && meta.glowColor !== "transparent";

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Outer Glow container */}
      <div
        className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${dimension}`}
        style={hasGlow ? { boxShadow: `0 0 16px ${meta.glowColor}` } : undefined}
      >
        {/* Avatar Circle */}
        <div
          className={`relative h-full w-full overflow-hidden rounded-full border-2 bg-surface-elevated ${meta.borderColor}`}
        >
          {!imageError ? (
            <Image
              src={meta.image}
              alt={`${meta.character} (${rank})`}
              width={px}
              height={px}
              priority={isPriority}
              className="h-full w-full object-cover select-none"
              onError={() => setImageError(true)}
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
            className={`absolute -bottom-1 -right-1 rounded-sm border bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-wide font-mono font-bold ${meta.badgeColor}`}
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

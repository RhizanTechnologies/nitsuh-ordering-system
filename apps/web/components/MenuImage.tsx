'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Coffee, Pizza, Wine, Cake, Sandwich, Sparkles, Soup, CupSoda } from 'lucide-react';

interface MenuImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  categoryName?: string;
  prepSection?: string;
}

export function MenuImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  categoryName = '',
  prepSection = '',
}: MenuImageProps) {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const getFallbackDetails = () => {
    const lowerCat = categoryName.toLowerCase();
    const lowerName = alt.toLowerCase();

    if (lowerCat.includes('pizza') || lowerName.includes('pizza')) {
      return {
        icon: <Pizza className="w-10 h-10 text-orange-500 stroke-[1.8]" />,
        bg: 'from-orange-500/15 via-stone-100 to-amber-500/10 dark:from-orange-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    if (lowerCat.includes('burger') || lowerCat.includes('sandwich') || lowerCat.includes('wrap') || lowerName.includes('burger')) {
      return {
        icon: <Sandwich className="w-10 h-10 text-amber-600 stroke-[1.8]" />,
        bg: 'from-amber-500/15 via-stone-100 to-orange-500/10 dark:from-amber-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    if (lowerCat.includes('drink') || lowerCat.includes('coffee') || lowerCat.includes('tea') || lowerName.includes('water') || lowerName.includes('coke') || lowerName.includes('juice') || lowerName.includes('shake')) {
      return {
        icon: <Coffee className="w-10 h-10 text-amber-700 dark:text-amber-400 stroke-[1.8]" />,
        bg: 'from-amber-500/15 via-stone-100 to-stone-200 dark:from-stone-900/60 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    if (lowerCat.includes('mojito') || lowerCat.includes('cocktail')) {
      return {
        icon: <Wine className="w-10 h-10 text-teal-600 dark:text-teal-400 stroke-[1.8]" />,
        bg: 'from-teal-500/15 via-stone-100 to-emerald-500/10 dark:from-teal-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    if (lowerCat.includes('cake') || lowerCat.includes('dessert') || lowerCat.includes('pastr') || lowerName.includes('sweet')) {
      return {
        icon: <Cake className="w-10 h-10 text-purple-600 dark:text-purple-400 stroke-[1.8]" />,
        bg: 'from-purple-500/15 via-stone-100 to-pink-500/10 dark:from-purple-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    if (lowerCat.includes('soup') || lowerName.includes('soup') || lowerName.includes('foul')) {
      return {
        icon: <Soup className="w-10 h-10 text-rose-600 dark:text-rose-400 stroke-[1.8]" />,
        bg: 'from-rose-500/15 via-stone-100 to-amber-500/10 dark:from-rose-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
      };
    }
    return {
      icon: <Utensils className="w-10 h-10 text-amber-600 dark:text-amber-400 stroke-[1.8]" />,
      bg: 'from-amber-500/15 via-stone-100 to-orange-500/10 dark:from-amber-950/40 dark:via-[#1C1815] dark:to-[#14110E]',
    };
  };

  if (hasError || !src) {
    const fallback = getFallbackDetails();
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br ${fallback.bg} border border-stone-200/80 dark:border-white/10 relative overflow-hidden select-none ${className}`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-md border border-stone-200 dark:border-white/15 flex items-center justify-center shadow-md">
          {fallback.icon}
        </div>
        <span className="text-[11px] font-black text-stone-700 dark:text-zinc-300 mt-2 truncate max-w-[85%] text-center px-2">
          {alt.split('/')[0].trim()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

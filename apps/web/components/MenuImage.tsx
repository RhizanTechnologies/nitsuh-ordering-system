'use client';

import React, { useState } from 'react';
import { Utensils, Coffee, Pizza, Wine, Cake, Sandwich, Sparkles } from 'lucide-react';

interface MenuImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  categoryName?: string;
  prepSection?: string;
}

export function MenuImage({ src, alt, className = 'w-full h-full object-cover', categoryName = '', prepSection = '' }: MenuImageProps) {
  const [hasError, setHasError] = useState(!src);

  const getFallbackIcon = () => {
    const lowerCat = categoryName.toLowerCase();
    const lowerName = alt.toLowerCase();

    if (lowerCat.includes('pizza') || lowerName.includes('pizza')) {
      return <Pizza className="w-6 h-6 text-orange-600" />;
    }
    if (lowerCat.includes('burger') || lowerCat.includes('sandwich') || lowerCat.includes('wrap')) {
      return <Sandwich className="w-6 h-6 text-amber-700" />;
    }
    if (lowerCat.includes('drink') || lowerCat.includes('coffee') || lowerCat.includes('tea') || lowerCat.includes('juice') || lowerCat.includes('shake')) {
      return <Coffee className="w-6 h-6 text-stone-700" />;
    }
    if (lowerCat.includes('mojito') || lowerCat.includes('cocktail')) {
      return <Wine className="w-6 h-6 text-teal-600" />;
    }
    if (lowerCat.includes('cake') || lowerCat.includes('dessert') || lowerCat.includes('torta') || lowerCat.includes('pastr')) {
      return <Cake className="w-6 h-6 text-purple-600" />;
    }
    return <Utensils className="w-6 h-6 text-forest" />;
  };

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#F3EFE6] border border-[#DDD6C6] ${className}`}>
        {getFallbackIcon()}
        <span className="text-[10px] font-bold text-gray-400 mt-1 truncate max-w-[90%] text-center px-1">
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

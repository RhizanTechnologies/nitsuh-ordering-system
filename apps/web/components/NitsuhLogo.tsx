'use client';

import React from 'react';
import Link from 'next/link';

interface NitsuhLogoProps {
  variant?: 'navbar' | 'login' | 'hero' | 'compact';
  showSubtitle?: boolean;
  className?: string;
}

export function NitsuhLogo({
  variant = 'navbar',
  showSubtitle,
  className = '',
}: NitsuhLogoProps) {
  const shouldShowSubtitle = showSubtitle !== undefined ? showSubtitle : variant === 'login' || variant === 'hero';

  if (variant === 'login' || variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Clean Circular Brand Emblem */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 p-2 shadow-lg ring-4 ring-amber-500/20 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
            <img
              src="/nitsuh-logo.png"
              alt="Nitsuh Foods"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] relative z-10"
            />
          </div>
        </div>

        {/* Brand Typographic Lockup */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 leading-none">
            <span className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-white">
              NITSUH
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-[#B83E18] dark:text-rose-400 border border-rose-500/30">
              FOODS
            </span>
          </div>
          {shouldShowSubtitle && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 font-medium mt-1 tracking-tight">
              Real Taste &amp; Savoury Bites
            </p>
          )}
        </div>
      </div>
    );
  }

  // Navbar & Compact Variant (Matching Reference Design)
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 transition select-none ${className}`}
      title="Nitsuh Foods"
    >
      {/* Circular Emblem matching Reference (Yellow/Amber circle with logo) */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 p-1 shadow-xs ring-1 ring-amber-400/40 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
          <img
            src="/nitsuh-logo.png"
            alt="Nitsuh Foods"
            className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)] relative z-10"
          />
        </div>
      </div>

      {/* Typographic Identity: Brand Name + Tag Badge + Subtitle */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-heading font-black text-sm sm:text-base tracking-tight text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
            NITSUH
          </span>
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-500/15 text-[#B83E18] dark:text-rose-400 border border-rose-500/30">
            FOODS
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-zinc-400 font-medium leading-none mt-1">
          Real Taste & Savoury Bites
        </span>
      </div>
    </Link>
  );
}

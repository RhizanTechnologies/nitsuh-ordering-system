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
        {/* Creative Jewel Emblem */}
        <div className="relative mb-4 group">
          {/* Ambient luminous aura */}
          <div className="absolute -inset-2 bg-gradient-to-r from-red-600/30 via-amber-500/30 to-rose-600/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
          
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#1C1815] via-[#2A1810] to-[#120F0D] p-3 shadow-2xl border border-amber-500/30 ring-1 ring-white/20 flex items-center justify-center overflow-hidden">
            {/* Fine metallic inner border */}
            <div className="absolute inset-1 rounded-[20px] border border-amber-400/20 pointer-events-none" />
            
            {/* Background radiant radial flare */}
            <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent opacity-60" />

            {/* Official Logo Image with drop shadow */}
            <img
              src="/nitsuh-logo.png"
              alt="Nitsuh Foods Brand Emblem"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)] relative z-10 transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Micro Quality Seal Tag */}
          <div className="absolute -bottom-2 inset-x-0 flex justify-center">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-[9px] font-black tracking-widest uppercase text-zinc-950 px-2.5 py-0.5 rounded-full shadow-md border border-amber-300/40">
              PURE TASTE
            </span>
          </div>
        </div>

        {/* Brand Typographic Lockup */}
        <div className="mt-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase leading-tight flex items-center justify-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF4444] via-[#F87171] to-[#DC2626] drop-shadow-sm">
              NITSUH
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 drop-shadow-sm">
              FOODS
            </span>
          </h1>
          
          {shouldShowSubtitle && (
            <div className="space-y-1 mt-1.5">
              <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 tracking-tight">
                From Savour Bites to Sweet Delights – We Cater It All!
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
                <span>Addis Ababa, Ethiopia</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-mono text-stone-800 dark:text-zinc-200 font-bold">0966833177</span>
              </div>
            </div>
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

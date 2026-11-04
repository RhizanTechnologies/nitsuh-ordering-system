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
  showSubtitle = true,
  className = '',
}: NitsuhLogoProps) {
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
          
          {showSubtitle && (
            <div className="space-y-1 mt-1.5">
              <p className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-300 tracking-tight">
                From Savour Bites to Sweet Delights – We Cater It All!
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Addis Ababa, Ethiopia</span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="font-mono text-zinc-700 dark:text-zinc-300">0966833177</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Navbar & Compact Variant
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 sm:gap-3 transition select-none ${className}`}
      title="Nitsuh Foods - Addis Ababa Terminal"
    >
      {/* Creative Artisan Emblem Pill */}
      <div className="relative flex-shrink-0">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/40 to-amber-500/40 rounded-2xl blur-[4px] opacity-0 group-hover:opacity-100 transition duration-300" />
        
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#1F1B18] via-[#2A1810] to-[#14110E] p-1.5 shadow-md border border-amber-500/30 ring-1 ring-white/10 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
          {/* Subtle gold inner accent */}
          <div className="absolute inset-0.5 rounded-[12px] border border-amber-400/15 pointer-events-none" />

          {/* Logo Brand Imagery */}
          <img
            src="/nitsuh-logo.png"
            alt="Nitsuh Foods"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] relative z-10"
          />
        </div>

        {/* Live Status indicator dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#12100E] shadow-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        </div>
      </div>

      {/* Typographic Identity */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-sm sm:text-base font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#F87171] drop-shadow-xs">
            NITSUH
          </span>
          <span className="text-sm sm:text-base font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] drop-shadow-xs">
            FOODS
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tracking-tight leading-tight">
              Addis Ababa
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">•</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono tracking-tight leading-tight">
              0966833177
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

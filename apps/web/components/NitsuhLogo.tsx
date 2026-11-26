'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const shouldShowSubtitle = showSubtitle !== undefined ? showSubtitle : variant === 'login' || variant === 'hero';

  const brandName = t('brand_name', 'NITSUH');
  const brandTag = t('brand_tag', 'FOODS');
  const brandSlogan = t('brand_slogan', 'Real Taste & Savoury Bites');
  const brandFullTitle = t('brand_full_title', 'NITSUH FOODS & CAFE');

  if (variant === 'login' || variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Clean Circular Brand Emblem */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md ring-2 ring-stone-200/80 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
            <img
              src="/nitsuh-logo.png"
              alt={brandFullTitle}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Brand Typographic Lockup */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 leading-none">
            <span className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-stone-900">
              {brandName}
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/30">
              {brandTag}
            </span>
          </div>
          {shouldShowSubtitle && (
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1 tracking-tight">
              {brandSlogan}
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
      title={brandFullTitle}
    >
      {/* Circular Emblem matching Reference (Clean circular brand icon) */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-2xs ring-1 ring-stone-200/90 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
          <img
            src="/nitsuh-logo.png"
            alt={brandFullTitle}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Typographic Identity: Brand Name + Tag Badge + Subtitle */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-heading font-black text-sm sm:text-base tracking-tight text-stone-900 group-hover:text-emerald-700 transition">
            {brandName}
          </span>
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/30">
            {brandTag}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium leading-none mt-1 truncate max-w-[120px] sm:max-w-none">
          {brandSlogan}
        </span>
      </div>
    </Link>
  );
}

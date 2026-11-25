'use client';

import React from 'react';
import { MenuImage } from '@/components/MenuImage';
import { Plus, Minus } from 'lucide-react';

export interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    price: number | string;
    imageUrl?: string;
    category?: { name?: string };
    prepSection?: string;
    applicableAddons?: any[];
    isDirectSale?: boolean;
    [key: string]: any;
  };
  quantity?: number;
  onAdd: (item: any) => void;
  onUpdateQuantity?: (item: any, delta: number) => void;
  onCustomize?: (item: any) => void;
  className?: string;
}

export function MenuItemCard({
  item,
  quantity = 0,
  onAdd,
  onUpdateQuantity,
  onCustomize,
  className,
}: MenuItemCardProps) {
  const isSelected = quantity > 0;

  const handleClick = () => {
    if (item.applicableAddons && item.applicableAddons.length > 0 && onCustomize) {
      onCustomize(item);
    } else {
      onAdd(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-md ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/25 shadow-sm'
          : 'border-stone-200/90 hover:border-emerald-500/50'
      } ${className || ''}`}
    >
      {/* Full Culinary Image Header (Edge-to-Edge Shadcn Style, No Awkward Cropping) */}
      <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden flex-shrink-0">
        <MenuImage
          src={item.imageUrl}
          alt={item.name}
          categoryName={item.category?.name}
          prepSection={item.prepSection}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Selected Count Badge Overlay */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <span>x{quantity}</span>
          </div>
        )}

        {/* Station Tag */}
        {item.prepSection && (
          <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            {item.prepSection}
          </div>
        )}
      </div>

      {/* Card Content: Category Tag, Dish Title */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block truncate">
              {item.category?.name || 'Dish'}
            </span>
            {item.applicableAddons && item.applicableAddons.length > 0 && (
              <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full whitespace-nowrap">
                +{item.applicableAddons.length} Add-ons
              </span>
            )}
          </div>
          <h3
            className="font-heading font-black text-sm sm:text-base text-stone-900 leading-snug group-hover:text-emerald-700 transition line-clamp-1"
            title={item.name}
          >
            {item.name}
          </h3>
        </div>

        {/* Card Footer: Price & Add / Stepper */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-100">
          <div>
            <div className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
              {Number(item.price).toFixed(2)}{' '}
              <span className="text-[10px] font-bold text-stone-500">ETB</span>
            </div>
          </div>

          {/* Stepper or Quick Add Button */}
          {quantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 bg-emerald-600 text-white p-1 rounded-xl shadow-xs"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity?.(item, -1);
                }}
                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center cursor-pointer transition active:scale-90"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span className="text-xs font-black px-1.5 min-w-[18px] text-center select-none font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity?.(item, 1);
                }}
                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center cursor-pointer transition active:scale-90"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {item.applicableAddons && item.applicableAddons.length > 0 && onCustomize ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomize(item);
                  }}
                  className="h-8 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 text-emerald-800 hover:text-white font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                  title="Customize with add-ons"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Customize</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                  }}
                  className="h-8 px-3 rounded-xl bg-stone-100 hover:bg-emerald-600 text-stone-700 hover:text-white font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer group-hover:bg-emerald-600 group-hover:text-white active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Bottom Green Accent Bar (ClaPos style when in order) */}
      {isSelected && <div className="h-1 w-full bg-emerald-500" />}
    </div>
  );
}

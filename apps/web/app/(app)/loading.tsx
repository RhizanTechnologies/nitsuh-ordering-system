import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-3">
        <Loader2 className="w-7 h-7 animate-spin stroke-[2.5]" />
      </div>
      <h3 className="text-sm font-bold text-stone-800 tracking-tight font-heading">
        Loading...
      </h3>
      <p className="text-xs text-stone-500 mt-0.5">
        Fetching latest data for your station
      </p>
    </div>
  );
}

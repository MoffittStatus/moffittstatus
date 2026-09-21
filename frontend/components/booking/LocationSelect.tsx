"use client";

import React, { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBooking } from '@/context/BookingContext';
import { LIBRARIES } from '@/lib/booking-utils';
import { LibrarySlug } from '@/types/booking';

export const LocationSelect = memo(() => {
  const { slug, setSlug } = useBooking();

  return (
    <div className="w-full max-w-xl">
      <Select 
        value={slug} 
        onValueChange={(newSlug) => setSlug(newSlug as LibrarySlug)}
      >
        <SelectTrigger className="w-full h-auto py-10 px-5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-md transition-all focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.99] [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-slate-400 [&>svg]:opacity-100">
          <div className="text-left truncate">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Selected Location
            </span>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight block truncate">
              <SelectValue />
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-50">
          {LIBRARIES.map((lib) => (
            <SelectItem 
              key={lib.slug} 
              value={lib.slug}
              className="py-3 px-4 text-sm font-semibold text-slate-700 rounded-xl cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-900 data-[state=checked]:font-extrabold transition-colors"
            >
              {lib.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

LocationSelect.displayName = "LocationSelect";
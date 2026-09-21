"use client";

import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBooking } from '@/context/BookingContext';
import { HOURS, formatHourLabel } from '@/lib/booking-utils';

export const FiltersBar = memo(() => {
  const { 
    startHour, 
    setStartHour, 
    endHour, 
    setEndHour, 
    minCapacity, 
    setMinCapacity 
  } = useBooking();

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200/60">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>From</span>
        <Select 
          value={String(startHour)} 
          onValueChange={(val) => setStartHour(Number(val))}
        >
          <SelectTrigger className="h-7 border-0 p-0 shadow-none font-bold text-indigo-600 focus:ring-0 w-auto bg-transparent gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {HOURS.slice(0, 24).map((h) => (
              <SelectItem key={h} value={String(h)}>{formatHourLabel(h)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span>To</span>
        <Select 
          value={String(endHour)} 
          onValueChange={(val) => setEndHour(Number(val))}
        >
          <SelectTrigger className="h-7 border-0 p-0 shadow-none font-bold text-indigo-600 focus:ring-0 w-auto bg-transparent gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {HOURS.filter((h) => h > startHour).map((h) => (
              <SelectItem key={h} value={String(h)}>{formatHourLabel(h)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select value={minCapacity} onValueChange={setMinCapacity}>
        <SelectTrigger className="w-auto h-9 px-4 bg-white border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-2xs">
          <SelectValue placeholder="Capacity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Any">Capacity: Any</SelectItem>
          <SelectItem value="2">Capacity: 2+ people</SelectItem>
          <SelectItem value="4">Capacity: 4+ people</SelectItem>
          <SelectItem value="6">Capacity: 6+ people</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

FiltersBar.displayName = "FiltersBar";
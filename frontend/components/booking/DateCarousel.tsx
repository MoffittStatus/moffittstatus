"use client";

import React, { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useBooking } from '@/context/BookingContext';
import { formatDateKey } from '@/lib/booking-utils';

export const DateCarousel = memo(() => {
  const { selectedDateKey, setSelectedDateKey, weekOffset, setWeekOffset } = useBooking();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() => {
    const list = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const isToday = d.getTime() === today.getTime();
      const key = formatDateKey(d);

      list.push({
        key,
        day: isToday ? 'TODAY' : daysOfWeek[d.getDay()],
        date: d.getDate().toString(),
        isPast: d.getTime() < today.getTime(),
        fullDate: d
      });
    }
    return list;
  }, [today, weekOffset]);

  const currentMonthYear = useMemo(() => {
    if (!dates.length) return '';
    return dates[0].fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [dates]);

  return (
    <div className="pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">{currentMonthYear}</span>
          {weekOffset > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setWeekOffset(0);
                setSelectedDateKey(formatDateKey(new Date()));
              }}
              className="h-6 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full px-2.5"
            >
              Jump to Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="h-8 w-8 rounded-xl border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="h-8 w-8 rounded-xl border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none p-1">
        {dates.map((item) => {
          const isSelected = selectedDateKey === item.key;
          return (
            <Button
              key={item.key}
              disabled={item.isPast}
              onClick={() => setSelectedDateKey(item.key)}
              variant={isSelected ? "default" : "outline"}
              className={`flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 scale-105 border-transparent'
                  : 'bg-white text-slate-700 border-slate-200/60 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {item.day}
              </span>
              <span className="text-xl font-extrabold mt-0.5">{item.date}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
});

DateCarousel.displayName = "DateCarousel";
import React, { useState, useMemo } from 'react';
import { getScheduleByName } from '@/lib/gMapCapacities';

const DEFAULT_OPERATING_HOURS = "11am - 8pm";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Parses strings like "8am - 10pm", "11:00 A.M. - 8:00 P.M.", "11am-8pm"
 */
function parseOperatingHours(rawStr: string) {
  if (!rawStr) return { start: 0, end: 23 };
  
  const clean = rawStr.toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  const parts = clean.split('-');
  
  if (parts.length !== 2) return { start: 0, end: 23 };

  const parseHour = (timePart: string) => {
    const isPM = timePart.includes('p');
    const isAM = timePart.includes('a');
    const digits = timePart.replace(/am|pm/g, '');
    let [h] = digits.split(':');
    let hour = parseInt(h, 10);

    if (isNaN(hour)) return 0;
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return hour;
  };

  return { start: parseHour(parts[0]), end: parseHour(parts[1]) };
}

/**
 * Formats 24h index to ultra-compact label (e.g., 11 -> "11a", 12 -> "12p", 15 -> "3p")
 */
function formatCompactHour(hour: number) {
  if (hour === 0 || hour === 24) return "12a";
  if (hour === 12) return "12p";
  return hour > 12 ? `${hour - 12}p` : `${hour}a`;
}

export default function ScheduleChart({ 
  operatingHours = DEFAULT_OPERATING_HOURS,
  name
}: { operatingHours?: string, name: string }) {
  const data = getScheduleByName(name) || null;
  if (!data) return <div />;

  // Real-time current day and hour
  const now = new Date();
  const currentDayName = DAYS[now.getDay()];
  const currentHour = now.getHours();

  // State
  const [selectedDay] = useState(currentDayName);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const isSelectedToday = selectedDay === currentDayName;

  // Retrieve selected day data case-insensitively
  const dayData = useMemo(() => {
    if (!data) return null;
    const key = Object.keys(data).find(
      (k) => k.toLowerCase() === selectedDay.toLowerCase()
    );
    return key ? data[key] : data[selectedDay] || null;
  }, [data, selectedDay]);

  const percentages: number[] = useMemo(() => {
    return dayData?.hourly_percentages || [];
  }, [dayData]);

  // Crop X-axis to only show open/valid operating hours
  const { start: parsedStart, end: parsedEnd } = useMemo(() => {
    return parseOperatingHours(operatingHours);
  }, [operatingHours]);

  const visibleHours = useMemo(() => {
    let start = parsedStart;
    let end = parsedEnd;

    // Fallback: If operating hours span full day (0-23), trim using non-zero percentages
    if (start === 0 && end === 23 && percentages.length > 0) {
      const activeIndices = percentages
        .map((pct, idx) => (pct > 0 ? idx : -1))
        .filter((idx) => idx !== -1);

      if (activeIndices.length > 0) {
        start = Math.min(...activeIndices);
        end = Math.max(...activeIndices);
      }
    }

    const hours: number[] = [];
    if (start <= end) {
      for (let h = start; h <= end; h++) hours.push(h);
    } else {
      // Overnight range
      for (let h = start; h <= 23; h++) hours.push(h);
      for (let h = 0; h <= end; h++) hours.push(h);
    }
    return hours.length > 0 ? hours : Array.from({ length: 24 }, (_, i) => i);
  }, [parsedStart, parsedEnd, percentages]);

  return (
    <div className="w-full font-sans text-xs overflow-visible py-1">
      {/* pt-5 gives headroom for text floating above 100% bars */}
      <div className="flex items-stretch gap-1.5 pt-5">
        
        {/* Y-AXIS TICKS (LEFT SIDE) */}
        <div className="flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none h-16 text-right pr-0.5 shrink-0 w-6">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* CHART & X-AXIS CONTAINER */}
        <div className="relative flex-1 flex flex-col min-w-0">
          
          {/* BACKGROUND GRID LINES */}
          <div className="absolute inset-0 h-16 flex flex-col justify-between pointer-events-none z-0">
            <div className="border-b border-slate-100 w-full" />
            <div className="border-b border-slate-100 border-dashed w-full" />
            <div className="border-b border-slate-200 w-full" />
          </div>

          {/* BARS GRAPH AREA */}
          <div className="h-16 flex items-end justify-between gap-[2px] w-full relative z-10">
            {visibleHours.map((hour) => {
              const pct = percentages[hour] || 0;
              const isCurrent = isSelectedToday && hour === currentHour;
              const isHovered = hoveredHour === hour;
              const barHeightPct = Math.max(pct, 4);

              return (
                <div
                  key={hour}
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="relative flex-1 min-w-0 flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  {/* BAR */}
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`relative w-full max-w-[12px] rounded-t-[2px] transition-all duration-150 ${
                      isCurrent
                        ? 'bg-purple-500 ring-1 ring-purple-300 shadow-xs'
                        : isHovered
                        ? 'bg-purple-400'
                        : pct > 0
                        ? 'bg-slate-200 group-hover:bg-slate-300'
                        : 'bg-slate-100'
                    }`}
                  >
                    {/* CLEAN FLOATING PERCENTAGE TEXT (NO BACKGROUND) */}
                    {(isCurrent || isHovered) && (
                      <span
                        className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold leading-none select-none pointer-events-none whitespace-nowrap z-20 ${
                          isCurrent ? 'text-purple-600' : 'text-slate-700'
                        }`}
                      >
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-AXIS LABELS */}
          <div className="flex items-center justify-between gap-[2px] w-full mt-1 z-10">
            {visibleHours.map((hour) => {
              const isCurrent = isSelectedToday && hour === currentHour;
              return (
                <span
                  key={hour}
                  className={`flex-1 min-w-0 text-[8px] font-medium leading-none truncate text-center ${
                    isCurrent ? 'text-purple-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  {formatCompactHour(hour)}
                </span>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
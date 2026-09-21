'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '../statusBadge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LibrariesLoading } from '../librariesLoading';
import { featureConfig, getSlugFromName, Library } from '@/lib/libData';
import ScheduleChart from '../scheduleChart';
import { useFilter } from '@/context/FilterContext';



export default function LibraryDataSection({ data }: { data: Library[] }) {
  const router = useRouter();

  // 1. Consume shared filter/search context for instant 0ms updates
  const { searchQuery, selectedFilters } = useFilter();

  // 2. Safe LocalStorage reading on mount for pinned items
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pinnedLibs');
      if (saved) setPinnedIds(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load pinned libraries:', e);
    }
  }, []);

  const togglePin = (id: number) => {
    setPinnedIds((prev) => {
      const newPins = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id];

      localStorage.setItem('pinnedLibs', JSON.stringify(newPins));
      return newPins;
    });
  };

  // 3. Instant in-memory filtering directly from props + context
  const query = searchQuery.toLowerCase();
  const filteredLibraries = (data ?? [])
  .filter((lib) => {
    const matchesTags =
      selectedFilters.length === 0 ||
      selectedFilters.every((key) => Boolean(lib.features?.[key as keyof typeof lib.features]));

    const searchLower = query.toLowerCase();
    const matchesSearch =
      lib.name.toLowerCase().includes(searchLower) ||
      lib.name.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase().includes(searchLower) ||
      Boolean(lib.address && lib.address.toLowerCase().includes(searchLower));

    return matchesTags && matchesSearch;
  })
  .sort((a, b) => {
    // 3. Tertiary: Least crowded first (Ascending)
    return (a.crowdLevel ?? 0) - (b.crowdLevel ?? 0);
  })
  .sort((a, b) => {
    // 1. Primary Sort: Open libraries first
    const openDiff = Number(Boolean(b.isOpen)) - Number(Boolean(a.isOpen));
    if (openDiff !== 0) {
      return openDiff; // If one is open and the other is closed, return the difference immediately
    }

    // 2. Secondary Sort (Tie-breaker): Number of open rooms (descending: most rooms first)
    return (b.roomsOpen ?? 0) - (a.roomsOpen ?? 0);
  })
  
  .sort((a, b) => {
    // Coerce isOpen to strict booleans (treats undefined/null as false)
    // Subtracting puts `true` (1) before `false` (0)
    return Number(Boolean(b.isOpen)) - Number(Boolean(a.isOpen));
  })
  ;

  // 4. Sort pinned libraries to the top
  const sortedLibraries = [...(filteredLibraries || [])].sort((a, b) => {
    const isAPinned = pinnedIds.includes(a.id);
    const isBPinned = pinnedIds.includes(b.id);

    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0;
  });

  if (!data) return <LibrariesLoading />;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 border-none bg-transparent shadow-none">
        {sortedLibraries.map((lib) => {
          const isPinned = pinnedIds.includes(lib.id);

          return (
            <Card
              key={lib.id}
              className="p-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs transition-all hover:shadow-md"
            >
              {/* Top Image Section */}
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={lib.image}
                  alt={`${lib.name} exterior`}
                  className="h-full w-full object-cover"
                />

                {/* Top Left: Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                  {lib.isOpen ? (
                    <StatusBadge crowdLevel={lib.crowdLevel} variant="" />
                  ) : (
                    <StatusBadge variant="closed" crowdLevel={0} />
                  )}
                </div>

                {/* Top Right: Map Location Button */}
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lib.url) window.open(lib.url, '_blank');
                  }}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-none transition-transform active:scale-95"
                >
                  <MapPin className="h-4 w-4" />
                </Button>

                {/* Bottom Left Badge: Available Rooms Overlay */}
                {lib.isOpen && lib.roomsTotal > 0 && (
                  <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-medium border border-white/10">
                    {lib.roomsOpen} {lib.roomsOpen > 1 ? 'rooms' : 'room'} available
                  </div>
                )}
              </div>

              {/* Card Body Section */}
              <CardContent className="p-5 flex flex-col gap-3 pt-0">
                {/* Title */}
                <CardTitle className="text-xl font-bold text-slate-900 leading-snug tracking-tight mt-4">
                  {lib.name}
                </CardTitle>

                {/* Hours */}
                {lib.hours && !lib.hours.includes('Closed') && (
                  <div className="flex items-center text-slate-500 text-sm gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{lib.hours}</span>
                  </div>
                )}

                {lib.isOpen && lib.hours.length > 3 && (
                  <ScheduleChart name={lib.name} operatingHours={lib.hours} />
                )}

                {/* Horizontal Divider */}
                <div className="w-full border-t border-slate-100 my-1" />

                {/* Feature Icons Row */}
                <div className="flex items-center gap-3.5 text-slate-400">
                  {featureConfig.map((feature) => {
                    const isActive = lib.features?.[feature.key as keyof typeof lib.features];
                    const IconComponent = feature.icon;

                    return (
                      <Tooltip key={feature.key}>
                        <TooltipTrigger asChild>
                          <div
                            className={`transition-colors ${
                              isActive ? 'text-slate-600' : 'text-slate-300 opacity-50'
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isActive ? feature.label : `No ${feature.label}`}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Action Button */}
                {lib.isOpen && lib.roomsOpen > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 py-2.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-600 font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/rooms?lib=' + getSlugFromName(lib.name));
                    }}
                  >
                    View Rooms <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
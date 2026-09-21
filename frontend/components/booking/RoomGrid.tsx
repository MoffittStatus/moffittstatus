"use client";

import React, { memo } from 'react';
import { Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useBooking } from '@/context/BookingContext';
import { RoomCard } from './RoomCard';

export const RoomGrid = memo(() => {
  const { loading, groupedRooms, slug } = useBooking();

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
        <p className="font-semibold text-sm animate-pulse">Loading study spaces...</p>
      </div>
    );
  }

  if (Object.keys(groupedRooms).length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
        <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="font-semibold text-sm">No study rooms match your selected filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4">
      {Object.values(groupedRooms).map((group) => (
        <div key={group.slug} className="space-y-4">
          {slug === "all" && (
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="text-lg font-black text-slate-900 tracking-tight">{group.name}</span>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 font-bold rounded-full px-2.5">
                {group.rooms.length} room{group.rooms.length === 1 ? '' : 's'} available
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {group.rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

RoomGrid.displayName = "RoomGrid";
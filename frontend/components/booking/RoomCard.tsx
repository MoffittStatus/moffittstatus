"use client";

import React, { memo } from 'react';
import { Users, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Room } from '@/types/booking';
import { useBooking } from '@/context/BookingContext';

interface RoomCardProps {
  room: Room;
}

export const RoomCard: React.FC<RoomCardProps> = memo(({ room }) => {
  const { slug, setBookingRoom } = useBooking();

  return (
    <Card className="rounded-3xl border-slate-100 shadow-xs flex flex-col justify-between bg-white overflow-hidden">
      <CardHeader className="p-6 pb-2 space-y-1">
        <CardTitle className="text-xl font-extrabold text-slate-900 tracking-tight">{room.name}</CardTitle>
        <CardDescription className="text-xs font-semibold text-slate-400">
          {room.type} {slug === "all" ? `• ${room.libraryName}` : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-2 space-y-2 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Capacity: {room.capacity} people</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{room.slots.length} matching slot{room.slots.length === 1 ? '' : 's'}</span>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-4">
        <Button
          onClick={() => setBookingRoom(room)}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
        >
          View & Book Room
        </Button>
      </CardFooter>
    </Card>
  );
});

RoomCard.displayName = "RoomCard";
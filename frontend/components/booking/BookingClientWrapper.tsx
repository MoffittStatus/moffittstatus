"use client";

import React from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useBooking } from '@/context/BookingContext';
import { LocationSelect } from './LocationSelect';
import { DateCarousel } from './DateCarousel';
import { FiltersBar } from './FiltersBar';
import { RoomGrid } from './RoomGrid';
import { BookingModal } from './BookingModal';

export const BookingClientWrapper: React.FC = () => {
  const router = useRouter();
  const { fetchRooms, loading } = useBooking();

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased pb-16">
      {/* HEADER CONTROLS */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-slate-900 gap-2 font-semibold px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to libraries</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRooms}
          disabled={loading}
          className="rounded-full text-xs font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-100 gap-1.5"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-4 space-y-4">
        <LocationSelect />
        <DateCarousel />
        <FiltersBar />
        <RoomGrid />
      </div>

      <BookingModal />
    </div>
  );
};
import React, { Suspense } from 'react';
import { BookingProvider } from '@/context/BookingContext';
import { BookingClientWrapper } from '@/components/booking/BookingClientWrapper';
export const revalidate = 30;

// Main Page Component - Server Component (no 'use client')
export default function LibraryRoomBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading Application...</p>
      </div>
    }>
      <BookingProvider>
        <BookingClientWrapper />
      </BookingProvider>
    </Suspense>
  );
}
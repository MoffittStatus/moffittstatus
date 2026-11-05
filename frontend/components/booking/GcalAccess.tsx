"use client";

import React, { memo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useBooking } from '@/context/BookingContext';
import { isGcalSlug } from '@/lib/booking-utils';
import { getGcalLoginUrl, signOutOfGcal } from '@/lib/gcal';

const SIGN_IN_ERRORS: Record<string, string> = {
  domain: 'Please sign in with your @berkeley.edu Google account.',
  denied: 'Google sign-in was cancelled. Calendar access is needed to see and request these rooms.',
  state: 'Your sign-in expired before it finished. Please try again.',
  failed: 'Google sign-in failed. Please try again.',
};

export const GcalSignInCard = memo(() => {
  const searchParams = useSearchParams();
  const signInError = SIGN_IN_ERRORS[searchParams.get('gcal_error') || ''];

  const handleSignIn = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('gcal_error');
    window.location.href = getGcalLoginUrl(`/rooms?${params.toString()}`);
  };

  return (
    <div className="py-12 px-6 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
      <CalendarDays className="w-8 h-8 mx-auto text-indigo-500" />
      <p className="font-extrabold text-slate-900">Sign in to see EECS rooms</p>
      <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
        Cory and Soda rooms are booked through Google Calendar. Sign in with your @berkeley.edu account
        to see open times. A request adds an event to your calendar and invites the room.
      </p>
      {signInError && <p className="text-xs font-semibold text-red-600">{signInError}</p>}
      <Button
        onClick={handleSignIn}
        className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
      >
        Sign in with Google
      </Button>
    </div>
  );
});

GcalSignInCard.displayName = "GcalSignInCard";

export const GcalAccountBar = memo(() => {
  const { gcalAccess, slug } = useBooking();

  if (!isGcalSlug(slug) || gcalAccess.status !== 'signedIn') return null;

  const handleSignOut = async () => {
    await signOutOfGcal().catch(() => undefined);
    // Reload to clear the rooms cached for this account
    window.location.reload();
  };

  return (
    <p className="text-xs font-semibold text-slate-500">
      Signed in as {gcalAccess.email} ·{' '}
      <Button
        variant="link"
        onClick={handleSignOut}
        className="h-auto p-0 text-xs font-semibold text-indigo-600"
      >
        Sign out
      </Button>
    </p>
  );
});

GcalAccountBar.displayName = "GcalAccountBar";

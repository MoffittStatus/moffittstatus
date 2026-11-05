import { BACKEND_URL } from './apiEndPoints';
import { RawRoomSlot } from '@/types/booking';

export class GcalError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface GcalBooking {
  eventId: string;
  htmlLink: string;
  status: string;
  roomResponse: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}/api/gcal${path}`, {
    ...init,
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GcalError(response.status, data.error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

// Where to send the browser to sign in with Google, coming back to returnTo afterwards
export function getGcalLoginUrl(returnTo: string) {
  return `${BACKEND_URL}/api/gcal/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function signOutOfGcal() {
  return request('/logout', { method: 'POST' });
}

// Free slots for a building on a date (YYYY-MM-DD), in the same shape as the LibCal rooms
export function getGcalAvailability(building: string, date: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ building, date });
  return request<{ email: string; slots: RawRoomSlot[] }>(`/availability?${params.toString()}`, { signal });
}

// Create a booking
export function createGcalBooking(bookingData: {
  roomId: string;
  date: string;
  startTime: string;
  title: string;
  description: string;
  affiliation: string;
  participants: string;
  speakers?: string;
}) {
  return request<GcalBooking>('/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
}

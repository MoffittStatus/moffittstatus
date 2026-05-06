import { BACKEND_URL } from './apiEndPoints';

export interface GcalRoom {
  id: string;
  summary: string;
  available?: boolean;
  busy_slots?: Array<{ start: string; end: string }>;
  capacity?: number;
}


// Get available rooms for a building with optional time range
export async function getGcalRooms(building: string = 'Cory', start?: string, end?: string) {
  const params = new URLSearchParams({ building });
  if (start) params.set('start', start);
  if (end) params.set('end', end);

  const response = await fetch(`${BACKEND_URL}/api/gcal/rooms?${params.toString()}`, {
    credentials: 'include',  // add this
  });
  if (!response.ok) throw new Error('Failed to fetch GCAL rooms');
  return response.json();
}

// Create a booking
export async function createGcalBooking(bookingData: {
  roomId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  affiliation?: string;
  participants?: string;
  speakers?: string;
}) {
  const response = await fetch(`${BACKEND_URL}/api/gcal/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create booking: ${error}`);
  }

  return response.json();
}

"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef, 
  useTransition 
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAvailableRooms } from '@/lib/libCal';
import { Room, RawRoomSlot, GroupedRooms, LibrarySlug } from '@/types/booking';
import { VALID_SLUGS, SINGLE_SLUGS, SLUG_TO_NAME, formatDateKey } from '@/lib/booking-utils';

interface BookingContextType {
  slug: LibrarySlug;
  selectedDateKey: string;
  weekOffset: number;
  minCapacity: string;
  startHour: number;
  endHour: number;
  bookingRoom: Room | null;
  rawRoomData: RawRoomSlot[];
  loading: boolean;
  isPending: boolean;
  groupedRooms: GroupedRooms;
  setSlug: (slug: LibrarySlug) => void;
  setSelectedDateKey: (dateKey: string) => void;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  setMinCapacity: (cap: string) => void;
  setStartHour: (h: number) => void;
  setEndHour: (h: number) => void;
  setBookingRoom: (room: Room | null) => void;
  fetchRooms: (bypassCache?: boolean) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// In-memory cache to prevent redundant fetches for previously visited dates/libraries
const roomCache = new Map<string, RawRoomSlot[]>();

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const rawSlug = searchParams.get('lib');
  const slug: LibrarySlug = (rawSlug && VALID_SLUGS.includes(rawSlug as LibrarySlug)) ? (rawSlug as LibrarySlug) : "all";
  
  const selectedDateKey = searchParams.get('date') || formatDateKey(new Date());
  const minCapacity = searchParams.get('minCap') || 'Any';
  const startHour = Number(searchParams.get('start') || 0);
  const endHour = Number(searchParams.get('end') || 24);

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [rawRoomData, setRawRoomData] = useState<RawRoomSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Ref to cancel active pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Non-blocking URL update helper
  const updateUrlParams = useCallback((newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const setSlug = useCallback((newSlug: LibrarySlug) => {
    updateUrlParams({ lib: newSlug });
  }, [updateUrlParams]);

  const setSelectedDateKey = useCallback((dateKey: string) => {
    updateUrlParams({ date: dateKey });
  }, [updateUrlParams]);

  const setMinCapacity = useCallback((cap: string) => {
    updateUrlParams({ minCap: cap });
  }, [updateUrlParams]);

  const setStartHour = useCallback((h: number) => {
    const nextEnd = h >= endHour ? Math.min(24, h + 1) : endHour;
    updateUrlParams({ start: h, end: nextEnd });
  }, [endHour, updateUrlParams]);

  const setEndHour = useCallback((h: number) => {
    updateUrlParams({ end: h });
  }, [updateUrlParams]);

  useEffect(() => {
    if (rawSlug && !VALID_SLUGS.includes(rawSlug as LibrarySlug)) {
      router.push('/rooms?lib=all');
    }
  }, [rawSlug, router]);

  const fetchRooms = useCallback(async (bypassCache = false) => {
    // 1. Cancel previous pending fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const cacheKey = `${selectedDateKey}_${slug}`;

    // 2. Return cached data immediately if available
    if (!bypassCache && roomCache.has(cacheKey)) {
      setRawRoomData(roomCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data: RawRoomSlot[] = [];
      if (slug === "all") {
        const results = await Promise.all(
          SINGLE_SLUGS.map(async (s) => {
            const res = await getAvailableRooms(selectedDateKey, s).catch(() => []);
            return (res || []).map((r: RawRoomSlot) => ({ ...r, librarySlug: s }));
          })
        );
        data = results.flat();
      } else {
        const res = await getAvailableRooms(selectedDateKey, slug).catch(() => []);
        data = (res || []).map((r: RawRoomSlot) => ({ ...r, librarySlug: slug }));
      }

      if (!controller.signal.aborted) {
        roomCache.set(cacheKey, data);
        setRawRoomData(data || []);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setRawRoomData([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [slug, selectedDateKey]);

  useEffect(() => {
    fetchRooms();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRooms]);

  // OPTIMIZED SINGLE-PASS ROOM GROUPING PIPELINE
  const groupedRooms = useMemo<GroupedRooms>(() => {
    if (!rawRoomData || rawRoomData.length === 0) return {};

    const roomMap = new Map<string, Room>();
    const roomMetaCache = new Map<string, { name: string; capacity: number }>();
    const parsedMinCap = minCapacity === 'Any' ? 0 : parseInt(minCapacity, 10);

    for (let i = 0; i < rawRoomData.length; i++) {
      const slot = rawRoomData[i];
      if (!slot || !slot.time) continue;

      const dashIdx = slot.time.indexOf(' - ');
      const timeStr = dashIdx !== -1 ? slot.time.substring(0, dashIdx) : slot.time;
      const spaceIdx = timeStr.lastIndexOf(' ');
      const startTime = spaceIdx !== -1 ? timeStr.substring(spaceIdx + 1, spaceIdx + 6) : '';
      const slotStartHour = startTime ? parseInt(startTime.split(':')[0], 10) : 0;

      if (slotStartHour < startHour || slotStartHour >= endHour) continue;

      // Avoid re-running regex on every time slot for the same room
      let meta = roomMetaCache.get(slot.id);
      if (!meta) {
        const capMatch = slot.name.match(/\(Capacity\s*(\d+)\)/i);
        const capacity = capMatch ? parseInt(capMatch[1], 10) : 4;
        const cleanName = slot.name.replace(/\s*\([^)]*\)/g, '').trim();
        meta = { name: cleanName, capacity };
        roomMetaCache.set(slot.id, meta);
      }

      if (meta.capacity < parsedMinCap) continue;

      let room = roomMap.get(slot.id);
      if (!room) {
        const libSlug = slot.librarySlug || slug;
        room = {
          id: slot.id,
          name: meta.name,
          capacity: meta.capacity,
          type: 'Study Space',
          librarySlug: libSlug,
          libraryName: SLUG_TO_NAME[libSlug] || "Library Space",
          slots: []
        };
        roomMap.set(slot.id, room);
      }

      const endTimeStr = dashIdx !== -1 ? slot.time.substring(dashIdx + 3) : '';
      const endSpaceIdx = endTimeStr.lastIndexOf(' ');
      const endTime = endSpaceIdx !== -1 ? endTimeStr.substring(endSpaceIdx + 1, endSpaceIdx + 6) : '';

      room.slots.push({
        time: startTime && endTime ? `${startTime} - ${endTime}` : slot.time,
        checksum: slot.checksum,
        startHour: slotStartHour,
        rawStartTime: startTime
      });
    }

    const groups: GroupedRooms = {};
    for (const room of roomMap.values()) {
      if (room.slots.length === 0) continue;
      if (!groups[room.librarySlug]) {
        groups[room.librarySlug] = {
          slug: room.librarySlug,
          name: room.libraryName,
          rooms: []
        };
      }
      groups[room.librarySlug].rooms.push(room);
    }
    return groups;
  }, [rawRoomData, minCapacity, startHour, endHour, slug]);

  return (
    <BookingContext.Provider value={{
      slug,
      selectedDateKey,
      weekOffset,
      minCapacity,
      startHour,
      endHour,
      bookingRoom,
      rawRoomData,
      loading,
      isPending,
      groupedRooms,
      setSlug,
      setSelectedDateKey,
      setWeekOffset,
      setMinCapacity,
      setStartHour,
      setEndHour,
      setBookingRoom,
      fetchRooms
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
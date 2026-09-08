"use client"
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  Filter,
  X,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSlugFromName } from "@/lib/libData";
import { getAvailableRooms } from '@/lib/libCal';

const SINGLE_SLUGS = ["main_stacks", "moffitt", "kresge"];
const VALID_SLUGS = ["all", ...SINGLE_SLUGS];

const SLUG_TO_NAME = {
  main_stacks: "Main (Gardner) Stacks",
  moffitt: "Moffitt Library",
  kresge: "Engineering & Mathematical Sciences Library"
};

const LIBRARY_OPTIONS = [
  "All Libraries",
  "Main (Gardner) Stacks",
  "Moffitt Library",
  "Engineering & Mathematical Sciences Library"
];

const CACHE_TTL_MS = 60 * 1000; // 1 minute cache duration
const HOURS = Array.from({ length: 25 }, (_, i) => i);

const formatHourLabel = (h) => {
  if (h === 0 || h === 24) return h === 0 ? "12 AM" : "12 AM (+1d)";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

// Helper: Format 24hr "13:00" into 12hr "1:00 PM"
const format12HourTime = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr || '00'} ${ampm}`;
};

// Helper: Convert "13:00 - 14:00" to "1:00 PM - 2:00 PM"
const formatSlotRange12Hr = (timeSlotStr) => {
  if (!timeSlotStr) return 'Available Slot';
  const parts = timeSlotStr.split(' - ');
  if (parts.length === 2) {
    return `${format12HourTime(parts[0])} - ${format12HourTime(parts[1])}`;
  }
  return format12HourTime(timeSlotStr);
};

export default function LibraryRoomBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlug = searchParams.get('lib');
  const slug = rawSlug || "all";

  const [availableOnly, setAvailableOnly] = useState(false);
  const [minCapacity, setMinCapacity] = useState('Any');
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // Selected time slot
  const [weekOffset, setWeekOffset] = useState(0);
  const [rawRoomData, setRawRoomData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cacheRef = useRef({});

  useEffect(() => {
    if (rawSlug && !VALID_SLUGS.includes(rawSlug)) {
      router.push('/rooms?lib=all');
    }
  }, [rawSlug, router]);

  // Reset selected slot when changing booking rooms
  useEffect(() => {
    setSelectedSlot(null);
  }, [bookingRoom]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const formatDateKey = (dateObj) => {
    return dateObj.toLocaleDateString('sv-SE', { timeZone: 'America/Los_Angeles' });
  };

  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));

  const dates = useMemo(() => {
    const list = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const isToday = d.getTime() === today.getTime();
      const isPast = d.getTime() < today.getTime();
      const key = formatDateKey(d);

      list.push({
        key,
        day: isToday ? 'TODAY' : daysOfWeek[d.getDay()],
        date: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        isPast,
        isToday,
        fullDate: d
      });
    }
    return list;
  }, [today, weekOffset]);

  const fetchRooms = useCallback(async (forceRefresh = false) => {
    if (!VALID_SLUGS.includes(slug)) return;

    const cacheKey = `${slug}_${selectedDateKey}`;
    const cachedEntry = cacheRef.current[cacheKey];
    const now = Date.now();

    if (!forceRefresh && cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
      setRawRoomData(cachedEntry.data);
      return;
    }

    if (forceRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      let data = [];
      if (slug === "all") {
        const results = await Promise.all(
          SINGLE_SLUGS.map(async (s) => {
            const res = await getAvailableRooms(selectedDateKey, s).catch(() => []);
            return (res || []).map((r) => ({ ...r, librarySlug: s }));
          })
        );
        data = results.flat();
      } else {
        const res = await getAvailableRooms(selectedDateKey, slug).catch(() => []);
        data = (res || []).map((r) => ({ ...r, librarySlug: slug }));
      }

      const roomData = data || [];
      cacheRef.current[cacheKey] = { timestamp: now, data: roomData };
      setRawRoomData(roomData);
    } catch {
      setRawRoomData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [slug, selectedDateKey]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleResetCache = () => {
    fetchRooms(true);
  };

  const currentMonthYear = useMemo(() => {
    if (!dates.length) return '';
    const first = dates[0].fullDate;
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [dates]);

  const processedRooms = useMemo(() => {
    const roomMap = new Map();

    rawRoomData.forEach((slot) => {
      const capMatch = slot.name.match(/\(Capacity\s*(\d+)\)/i);
      const capacity = capMatch ? parseInt(capMatch[1], 10) : 4;
      const cleanName = slot.name.replace(/\s*\([^)]*\)/g, '').trim();

      const timeParts = slot.time ? slot.time.split(' - ') : [];
      const startTime = timeParts[0] ? timeParts[0].split(' ')[1]?.slice(0, 5) : '';
      const endTime = timeParts[1] ? timeParts[1].split(' ')[1]?.slice(0, 5) : '';
      const timeSlotStr = startTime && endTime ? `${startTime} - ${endTime}` : slot.time;

      let slotStartHour = 0;
      if (startTime) {
        slotStartHour = parseInt(startTime.split(':')[0], 10);
      } else if (slot.time && slot.time.includes(':')) {
        slotStartHour = parseInt(slot.time.split(':')[0], 10);
      }

      const libSlug = slot.librarySlug || slug;
      const libName = SLUG_TO_NAME[libSlug] || "Library Space";

      if (!roomMap.has(slot.id)) {
        roomMap.set(slot.id, {
          id: slot.id,
          name: cleanName,
          capacity,
          type: 'Study Space',
          status: 'available',
          librarySlug: libSlug,
          libraryName: libName,
          slots: []
        });
      }

      roomMap.get(slot.id).slots.push({
        time: timeSlotStr,
        checksum: slot.checksum,
        startHour: slotStartHour,
        rawStartTime: startTime // Saved for %20 HH:MM parameter
      });
    });

    return Array.from(roomMap.values());
  }, [rawRoomData, slug]);

  const filteredRooms = useMemo(() => {
    return processedRooms
      .map((room) => {
        const matchingSlots = room.slots.filter(
          (slot) => slot.startHour >= startHour && slot.startHour < endHour
        );
        return { ...room, slots: matchingSlots };
      })
      .filter((room) => {
        const matchesAvailability = availableOnly ? room.status === 'available' : true;
        const matchesCapacity = minCapacity === 'Any' || room.capacity >= parseInt(minCapacity, 10);
        const hasMatchingSlots = room.slots.length > 0;

        return matchesAvailability && matchesCapacity && hasMatchingSlots;
      });
  }, [processedRooms, availableOnly, minCapacity, startHour, endHour]);

  const groupedRooms = useMemo(() => {
    const groups = {};
    filteredRooms.forEach((room) => {
      const key = room.librarySlug;
      if (!groups[key]) {
        groups[key] = {
          slug: key,
          name: room.libraryName,
          rooms: []
        };
      }
      groups[key].rooms.push(room);
    });
    return groups;
  }, [filteredRooms]);

  const handleLibrarySelect = (e) => {
    const selectedVal = e.target.value;
    let targetSlug = "all";

    if (selectedVal === "Main (Gardner) Stacks") targetSlug = "main_stacks";
    else if (selectedVal === "Moffitt Library") targetSlug = "moffitt";
    else if (selectedVal === "Engineering & Mathematical Sciences Library") targetSlug = "kresge";
    else if (getSlugFromName) targetSlug = getSlugFromName(selectedVal) || "all";

    router.push(`/rooms?lib=${targetSlug}`);
  };

  const currentLibraryName = useMemo(() => {
    if (slug === 'main_stacks') return "Main (Gardner) Stacks";
    if (slug === 'moffitt') return "Moffitt Library";
    if (slug === 'kresge') return "Engineering & Mathematical Sciences Library";
    return "All Libraries";
  }, [slug]);

  // Appends %20HH:MM to LibCal URL if slot selected
  const handleExternalBooking = (roomId, slotTime24) => {
    let dateParam = selectedDateKey;
    if (slotTime24) {
      dateParam += `%20${slotTime24}`;
    }

    window.open(
      `https://berkeley.libcal.com/space/${roomId}?date=${dateParam}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const resetAllFilters = () => {
    setAvailableOnly(false);
    setMinCapacity('Any');
    setStartHour(0);
    setEndHour(24);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased pb-16">
      {/* Top Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to libraries</span>
        </button>

        <button
          onClick={handleResetCache}
          disabled={isRefreshing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh cached room data"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Header & Selector */}
      <div className="max-w-6xl mx-auto px-6 mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative inline-block w-full max-w-xl">
            <select
              value={currentLibraryName}
              onChange={handleLibrarySelect}
              className="w-full appearance-none bg-transparent text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight pr-10 focus:outline-none cursor-pointer"
            >
              {LIBRARY_OPTIONS.map((name) => (
                <option key={name} value={name} className="text-base font-semibold text-slate-800">
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-6 h-6 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Selector Carousel */}
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {currentMonthYear}
              </span>
              {weekOffset > 0 && (
                <button
                  onClick={() => {
                    setWeekOffset(0);
                    setSelectedDateKey(formatDateKey(new Date()));
                  }}
                  className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                >
                  Jump to Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className={`p-1.5 rounded-xl border border-slate-200 transition-all ${
                  weekOffset === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-400 bg-slate-50'
                    : 'hover:bg-slate-100 text-slate-700 active:scale-95'
                }`}
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2">
            {dates.map((item) => {
              const isSelected = selectedDateKey === item.key;

              return (
                <button
                  key={item.key}
                  disabled={item.isPast}
                  onClick={() => setSelectedDateKey(item.key)}
                  className={`flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl transition-all duration-200 select-none ${
                    item.isPast
                      ? 'bg-slate-100/60 text-slate-300 border border-slate-100 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                      : 'bg-white text-slate-700 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span className={`text-[10px] font-bold tracking-wider ${
                    item.isPast
                      ? 'text-slate-300'
                      : isSelected
                      ? 'text-indigo-200'
                      : 'text-slate-400'
                  }`}>
                    {item.day}
                  </span>
                  <span className="text-xl font-extrabold mt-0.5">{item.date}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            {/* Hour Picker */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <span>From</span>
              <select
                value={startHour}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartHour(val);
                  if (val >= endHour) setEndHour(Math.min(24, val + 1));
                }}
                className="bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
              >
                {HOURS.slice(0, 24).map((h) => (
                  <option key={h} value={h}>
                    {formatHourLabel(h)}
                  </option>
                ))}
              </select>
              <span>To</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
              >
                {HOURS.filter((h) => h > startHour).map((h) => (
                  <option key={h} value={h}>
                    {formatHourLabel(h)}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity Filter */}
            <div className="relative">
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-8 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              >
                <option value="Any">Capacity: Any</option>
                <option value="2">Capacity: 2+ people</option>
                <option value="4">Capacity: 4+ people</option>
                <option value="6">Capacity: 6+ people</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Room Grid Display */}
        <div className="space-y-8 pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
              <p className="font-semibold text-sm animate-pulse">Loading study spaces...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">No study rooms match your selected filter criteria.</p>
              <button 
                onClick={resetAllFilters}
                className="mt-3 text-xs font-bold text-indigo-600 underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            Object.values(groupedRooms).map((group) => {
              if (group.rooms.length === 0) return null;

              return (
                <div key={group.slug} className="space-y-4">
                  {slug === "all" && (
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <span className="text-lg font-black text-slate-900 tracking-tight">
                        {group.name}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {group.rooms.length} room{group.rooms.length === 1 ? '' : 's'} available
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{room.name}</h3>
                            {/* <StatusBadge status={room.status} /> */}
                          </div>
                          <p className="text-xs font-semibold text-slate-400">
                            {room.type} {slug === "all" ? `• ${room.libraryName}` : ''}
                          </p>
                        </div>

                        <div className="space-y-2 text-xs font-semibold text-slate-500">
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Capacity: {room.capacity} people</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{room.slots.length} matching slot{room.slots.length === 1 ? '' : 's'}</span>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => setBookingRoom(room)}
                            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-98 flex items-center justify-center gap-2"
                          >
                            <span>View & Book Room</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Slot Selection Modal */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Reserve {bookingRoom.name}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {bookingRoom.libraryName} • Capacity: {bookingRoom.capacity} people
                </p>
              </div>
              <button 
                onClick={() => setBookingRoom(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Select a Time Slot (Optional)
                </label>
                {selectedSlot && (
                  <button 
                    onClick={() => setSelectedSlot(null)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Slot Selection Checklist */}
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {bookingRoom.slots.map((slot, index) => {
                  const isSelected = selectedSlot?.rawStartTime === slot.rawStartTime;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                          : 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="timeSlot"
                          checked={isSelected}
                          onChange={() => {}} // Controlled via parent button click
                          className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{formatSlotRange12Hr(slot.time)}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-extrabold text-indigo-600 tracking-wider">
                          Auto-Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => setBookingRoom(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleExternalBooking(bookingRoom.id, selectedSlot?.rawStartTime)}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <span>{selectedSlot ? 'Book Selected Slot' : 'Book on LibCal'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'available') {
    return (
      <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-700 text-[11px] font-bold">
        Available
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
      Occupied
    </span>
  );
}
"use client"
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Box, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation'

// Mock Room Data
const INITIAL_ROOMS = [
  { id: '301', name: 'Room 301', type: 'Focus Room', floor: '3rd Floor', capacity: 4, status: 'available', timeInfo: 'Available until 4:00 PM' },
  { id: '302', name: 'Room 302', type: 'Group Study', floor: '3rd Floor', capacity: 6, status: 'occupied', timeInfo: 'Next available at 2:30 PM' },
  { id: '303', name: 'Room 303', type: 'Huddle Room', floor: '3rd Floor', capacity: 2, status: 'available-soon', timeInfo: 'Available in 15 mins' },
  { id: '304', name: 'Room 304', type: 'Conference', floor: '3rd Floor', capacity: 8, status: 'available', timeInfo: 'Available until Closing' },
  { id: '401', name: 'Room 401', type: 'Focus Room', floor: '4th Floor', capacity: 4, status: 'available', timeInfo: 'Available until 5:00 PM' },
  { id: '402', name: 'Room 402', type: 'Focus Room', floor: '4th Floor', capacity: 4, status: 'occupied', timeInfo: 'Next available at 4:00 PM' },
  { id: '403', name: 'Room 403', type: 'Huddle Room', floor: '4th Floor', capacity: 3, status: 'available', timeInfo: 'Available until 1:00 PM' },
  { id: '501', name: 'Room 501', type: 'Boardroom', floor: '5th Floor', capacity: 12, status: 'available', timeInfo: 'Available until Closing' },
  { id: '502', name: 'Room 502', type: 'Focus Room', floor: '5th Floor', capacity: 4, status: 'available-soon', timeInfo: 'Available in 5 mins' },
];

export default function LibraryRoomBooking() {
    const router = useRouter()
  const [selectedFloor, setSelectedFloor] = useState('All Floors');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minCapacity, setMinCapacity] = useState('Any');
  const [bookingRoom, setBookingRoom] = useState(null);
  const [show3dModal, setShow3dModal] = useState(false);

  // Week offset state (0 = current week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Get normalized today at midnight (00:00:00) for accurate comparison
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Selected date key (YYYY-MM-DD), defaults to today
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Dynamically generate 7 days based on current weekOffset
  const dates = useMemo(() => {
    const list = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Base date = today + (weekOffset * 7 days)
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const isToday = d.getTime() === today.getTime();
      const isPast = d.getTime() < today.getTime();
      const key = d.toISOString().split('T')[0];

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

  // Current month & year display string (e.g. "September 2026")
  const currentMonthYear = useMemo(() => {
    if (!dates.length) return '';
    const first = dates[0].fullDate;
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [dates]);

  const filteredRooms = useMemo(() => {
    return INITIAL_ROOMS.filter((room) => {
      const matchesFloor = selectedFloor === 'All Floors' || room.floor === selectedFloor;
      const matchesAvailability = availableOnly ? room.status === 'available' : true;
      const matchesCapacity = minCapacity === 'Any' || room.capacity >= parseInt(minCapacity, 10);
      return matchesFloor && matchesAvailability && matchesCapacity;
    });
  }, [selectedFloor, availableOnly, minCapacity]);



  const handleConfirmBooking = () => {
    setBookingRoom(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased pb-16">
      {/* Top Bar Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to libraries</span>
        </button>

        <button 
          onClick={() => setShow3dModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
        >
          <Box className="w-4 h-4 text-indigo-600" />
          <span>Explore 3D Model</span>
        </button>
      </div>

      {/* Title & Metadata Header */}
      <div className="max-w-6xl mx-auto px-6 mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bioscience, Natural Resources & Public Health
          </h1>
          <button className="p-1.5 rounded-full hover:bg-slate-200/50 transition-colors">
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Not Crowded
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs md:text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>9 am – 6 pm</span>
          </div>
        </div>

        <div className="pt-3 space-y-3">
          {/* Calendar Controls Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {currentMonthYear}
              </span>
              {weekOffset > 0 && (
                <button
                  onClick={() => {
                    setWeekOffset(0);
                    setSelectedDateKey(today.toISOString().split('T')[0]);
                  }}
                  className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
                >
                  Jump to Today
                </button>
              )}
            </div>

            {/* Prev / Next Week Buttons */}
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

          {/* 7-Day Buttons Carousel */}
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
          <div className="inline-flex items-center p-1 bg-slate-200/60 rounded-2xl gap-1 self-start sm:self-auto">
            {['All Floors', '3rd Floor', '4th Floor', '5th Floor'].map((floor) => {
              const active = selectedFloor === floor;
              return (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {floor}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Available Now</span>
            </label>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">No study rooms match your selected filter criteria.</p>
              <button 
                onClick={() => { setSelectedFloor('All Floors'); setAvailableOnly(false); setMinCapacity('Any'); }}
                className="mt-3 text-xs font-bold text-indigo-600 underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{room.name}</h3>
                    <StatusBadge status={room.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    {room.type} • {room.floor}
                  </p>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Up to {room.capacity} people</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{room.timeInfo}</span>
                  </div>
                </div>

                <div>
                  {room.status === 'occupied' ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed select-none"
                    >
                      Currently Occupied
                    </button>
                  ) : room.status === 'available-soon' ? (
                    <button
                      onClick={() => setBookingRoom(room)}
                      className="w-full py-3 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all active:scale-98"
                    >
                      Book Room
                    </button>
                  ) : (
                    <button
                      onClick={() => setBookingRoom(room)}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-98"
                    >
                      Book Room
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {bookingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Reserve {bookingRoom.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{bookingRoom.type} • {bookingRoom.floor}</p>
              </div>
              <button 
                onClick={() => setBookingRoom(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Select Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 px-3 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 text-xs font-bold text-center">
                  1:00 PM – 2:00 PM
                </button>
                <button className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold text-center">
                  2:00 PM – 3:00 PM
                </button>
                <button className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold text-center">
                  3:00 PM – 4:00 PM
                </button>
                <button className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold text-center">
                  4:00 PM – 5:00 PM
                </button>
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
                onClick={handleConfirmBooking}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {show3dModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Interactive 3D Floor Map</h3>
              </div>
              <button 
                onClick={() => setShow3dModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-72 w-full bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
              <div className="relative z-10 text-center space-y-3">
                <div className="w-24 h-24 mx-auto border-2 border-indigo-500/80 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-indigo-500/20 bg-indigo-950/40">
                  <Box className="w-10 h-10 text-indigo-400 -rotate-45" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Rendering 3D Spatial Layout...</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShow3dModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Pill Helper Component
function StatusBadge({ status }) {
  if (status === 'available') {
    return (
      <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-700 text-[11px] font-bold">
        Available
      </span>
    );
  }
  if (status === 'available-soon') {
    return (
      <span className="px-2.5 py-1 rounded-md bg-amber-100/80 text-amber-800 text-[11px] font-bold">
        Available soon
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold">
      Occupied
    </span>
  );
}
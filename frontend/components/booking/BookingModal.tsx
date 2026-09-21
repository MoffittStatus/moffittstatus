"use client";

import React, { useState, memo } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useBooking } from '@/context/BookingContext';
import { RoomSlot } from '@/types/booking';
import { formatSlotRange12Hr } from '@/lib/booking-utils';

export const BookingModal = memo(() => {
  const { bookingRoom: room, selectedDateKey, setBookingRoom } = useBooking();
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot | null>(null);

  if (!room) return null;

  const handleClose = () => setBookingRoom(null);

  const handleExternalBooking = () => {
    let dateParam = selectedDateKey;
    if (selectedSlot?.rawStartTime) {
      dateParam += `%20${selectedSlot.rawStartTime}`;
    }
    window.open(`https://berkeley.libcal.com/space/${room.id}?date=${dateParam}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-200 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-3 text-left">
          <DialogTitle className="text-xl font-bold text-slate-900">Reserve {room.name}</DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-medium">
            {room.libraryName} • Capacity: {room.capacity} people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Select a Time Slot (Optional)
            </Label>
            {selectedSlot && (
              <Button 
                variant="link" 
                onClick={() => setSelectedSlot(null)} 
                className="h-auto p-0 text-[11px] font-semibold text-indigo-600"
              >
                Clear Selection
              </Button>
            )}
          </div>

          <RadioGroup 
            value={selectedSlot?.rawStartTime || ""} 
            onValueChange={(val) => {
              const found = room.slots.find(s => s.rawStartTime === val);
              setSelectedSlot(found || null);
            }}
            className="space-y-2 max-h-56 overflow-y-auto pr-1"
          >
            {room.slots.map((slot, index) => {
              const isSelected = selectedSlot?.rawStartTime === slot.rawStartTime;
              return (
                <div key={index} className="flex items-center">
                  <RadioGroupItem value={slot.rawStartTime} id={`slot-${index}`} className="sr-only" />
                  <Label
                    htmlFor={`slot-${index}`}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex justify-between items-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-1 ring-indigo-600' 
                        : 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{formatSlotRange12Hr(slot.time)}</span>
                    </div>
                    {isSelected && (
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] uppercase font-extrabold border-0">
                        Auto-Select
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <DialogFooter className="pt-2 flex flex-row gap-3 sm:justify-stretch">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="flex-1 py-5 rounded-2xl border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExternalBooking} 
            className="flex-1 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md gap-1.5"
          >
            <span>{selectedSlot ? 'Book Selected Slot' : 'Book on LibCal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BookingModal.displayName = "BookingModal";
"use client";

import React, { useEffect, useState, memo } from 'react';
import { CalendarCheck, ExternalLink } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBooking } from '@/context/BookingContext';
import { RoomSlot } from '@/types/booking';
import { formatSlotRange12Hr, isGcalSlug } from '@/lib/booking-utils';
import { createGcalBooking, GcalBooking, GcalError } from '@/lib/gcal';

const EMPTY_REQUEST = { title: '', description: '', affiliation: '', participants: '', speakers: '' };
const fieldLabelClass = "text-xs font-bold text-slate-600";

export const BookingModal = memo(() => {
  const { bookingRoom: room, selectedDateKey, setBookingRoom, fetchRooms } = useBooking();
  const [selectedSlot, setSelectedSlot] = useState<RoomSlot | null>(null);
  const [request, setRequest] = useState(EMPTY_REQUEST);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [booking, setBooking] = useState<GcalBooking | null>(null);

  // The dialog stays mounted between rooms, so don't carry a choice over to the next one
  const roomId = room?.id;
  useEffect(() => {
    setSelectedSlot(null);
    setRequest(EMPTY_REQUEST);
    setRequestError(null);
    setBooking(null);
  }, [roomId]);

  if (!room) return null;

  const isGcalRoom = isGcalSlug(room.librarySlug);
  const canRequest = Boolean(
    selectedSlot && request.title.trim() && request.description.trim() && request.affiliation.trim() && request.participants
  );

  const handleClose = () => setBookingRoom(null);

  const handleExternalBooking = () => {
    let dateParam = selectedDateKey;
    if (selectedSlot?.rawStartTime) {
      dateParam += `%20${selectedSlot.rawStartTime}`;
    }
    window.open(`https://berkeley.libcal.com/space/${room.id}?date=${dateParam}`, '_blank', 'noopener,noreferrer');
  };

  const updateRequest = (field: keyof typeof EMPTY_REQUEST) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setRequest((current) => ({ ...current, [field]: e.target.value }));

  const handleGcalRequest = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setRequestError(null);
    try {
      const result = await createGcalBooking({
        roomId: room.id,
        date: selectedDateKey,
        startTime: selectedSlot.rawStartTime,
        ...request,
      });
      setBooking(result);
      fetchRooms(true);
    } catch (err) {
      const { status, message } = err as GcalError;
      if (status === 401) {
        // Signed out: the refreshed page shows the sign-in prompt
        handleClose();
        fetchRooms(true);
        return;
      }
      setRequestError(message);
      if (status === 409) {
        setBookingRoom({ ...room, slots: room.slots.filter((s) => s !== selectedSlot) });
        setSelectedSlot(null);
        fetchRooms(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (booking) {
    const isAccepted = booking.roomResponse === 'accepted';
    return (
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-200 shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            <DialogTitle className="text-xl font-bold text-slate-900">
              {isAccepted ? `${room.name} is booked` : 'Request sent'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              {isAccepted
                ? 'The room accepted your invitation. The event is on your Google Calendar.'
                : `The event is on your Google Calendar, but ${room.name} isn't reserved until the room accepts the invitation. Check the event to see its response.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex flex-row gap-3 sm:justify-stretch">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 py-5 rounded-2xl border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Done
            </Button>
            <Button
              asChild
              className="flex-1 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md gap-1.5"
            >
              <a href={booking.htmlLink} target="_blank" rel="noopener noreferrer">
                <span>Open in Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!room} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3 text-left">
          <DialogTitle className="text-xl font-bold text-slate-900">Reserve {room.name}</DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-medium">
            {room.libraryName} • Capacity: {room.capacity} people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {isGcalRoom ? 'Select a Time Slot' : 'Select a Time Slot (Optional)'}
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
            className={`space-y-2 overflow-y-auto pr-1 ${isGcalRoom ? 'max-h-36' : 'max-h-56'}`}
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
                        ? 'border-none bg-indigo-50/80 text-indigo-900'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{formatSlotRange12Hr(slot.time)}</span>
                    </div>
                    {/* {isSelected && (
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] uppercase font-extrabold border-0">
                        Auto-Select
                      </Badge>
                    )} */}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {isGcalRoom && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="gcal-title" className={fieldLabelClass}>Event title</Label>
              <Input id="gcal-title" maxLength={200} value={request.title} onChange={updateRequest('title')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gcal-description" className={fieldLabelClass}>Event description</Label>
              <Textarea id="gcal-description" rows={2} maxLength={2000} value={request.description} onChange={updateRequest('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gcal-affiliation" className={fieldLabelClass}>EECS affiliation</Label>
                <Input id="gcal-affiliation" maxLength={200} value={request.affiliation} onChange={updateRequest('affiliation')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gcal-participants" className={fieldLabelClass}>Participants</Label>
                <Input id="gcal-participants" type="number" min={1} max={room.capacity} value={request.participants} onChange={updateRequest('participants')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gcal-speakers" className={fieldLabelClass}>Speakers and affiliations (optional)</Label>
              <Input id="gcal-speakers" maxLength={1000} value={request.speakers} onChange={updateRequest('speakers')} />
            </div>
            {requestError && <p role="alert" className="text-xs font-semibold text-red-600">{requestError}</p>}
          </div>
        )}

        <DialogFooter className="pt-2 flex flex-row gap-3 sm:justify-stretch">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 py-5 rounded-2xl border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            Cancel
          </Button>
          {isGcalRoom ? (
            <Button
              onClick={handleGcalRequest}
              disabled={!canRequest || submitting}
              className="flex-1 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              {submitting ? 'Sending...' : 'Request Room'}
            </Button>
          ) : (
            <Button
              onClick={handleExternalBooking}
              className="flex-1 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md gap-1.5"
            >
              <span>{selectedSlot ? 'Book Selected Slot' : 'Book on LibCal'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BookingModal.displayName = "BookingModal";

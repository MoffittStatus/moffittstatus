"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OccurrenceRow from "@/components/events/OccurrenceRow";
import {
  Attendee,
  EventVisibility,
  GroupEvent,
  Occurrence,
  RECURRENCE_LABELS,
  RSVP_LABELS,
  RsvpStatus,
  cancelOccurrence,
  deleteEvent,
  eventLibraries,
  formatLocation,
  getEvent,
  getOccurrence,
  rescheduleOccurrence,
  rsvp,
  updateEvent,
} from "@/lib/events";
import { errorMessage, isUnauthorized } from "@/lib/groups";

type AttendeeInfo = { counts: Record<RsvpStatus, number>; attendees: Attendee[] | null };

const toLocalInputs = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const EventPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<GroupEvent | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [attendeeInfo, setAttendeeInfo] = useState<Record<number, AttendeeInfo>>({});
  const [rescheduling, setRescheduling] = useState<{
    id: number;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [editing, setEditing] = useState(false);
  const [libraries, setLibraries] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    libraryId: "",
    locationDescription: "",
    maxAttendees: "",
    visibility: "PUBLIC" as EventVisibility,
  });

  const load = useCallback(async () => {
    try {
      const data = await getEvent(eventId);
      setEvent(data.event);
      setOccurrences(data.occurrences);
      setCanManage(data.canManage);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, success = "") => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      setAttendeeInfo({});
      await load();
    } catch (e) {
      setError(isUnauthorized(e) ? "Sign in to RSVP" : errorMessage(e));
    }
  };

  const toggleAttendees = async (occurrenceId: number) => {
    if (attendeeInfo[occurrenceId]) {
      const rest = { ...attendeeInfo };
      delete rest[occurrenceId];
      setAttendeeInfo(rest);
      return;
    }
    try {
      const { counts, attendees } = await getOccurrence(occurrenceId);
      setAttendeeInfo({ ...attendeeInfo, [occurrenceId]: { counts, attendees } });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const startEditing = async () => {
    if (!event) return;
    setForm({
      name: event.name,
      description: event.description ?? "",
      libraryId: event.library ? String(event.library.id) : "",
      locationDescription: event.locationDescription ?? "",
      maxAttendees: event.maxAttendees ? String(event.maxAttendees) : "",
      visibility: event.visibility,
    });
    setEditing(true);
    if (libraries.length === 0) setLibraries(await eventLibraries());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await updateEvent(eventId, {
        name: form.name,
        description: form.description,
        libraryId: form.libraryId ? Number(form.libraryId) : null,
        locationDescription: form.locationDescription,
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
        visibility: form.visibility,
      });
      setEditing(false);
    }, "Event updated");
  };

  const handleDelete = () => {
    if (!confirm("Delete this event? Upcoming dates will be cancelled. Past attendance is kept.")) return;
    run(async () => {
      await deleteEvent(eventId);
      router.push(`/groups/${event?.group.id}`);
    });
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduling) return;
    run(async () => {
      const { id, date, startTime, endTime } = rescheduling;
      await rescheduleOccurrence(
        id,
        new Date(`${date}T${startTime}`).toISOString(),
        new Date(`${date}T${endTime}`).toISOString(),
      );
      setRescheduling(null);
    }, "Date updated");
  };

  if (!event) {
    return <div className="max-w-2xl mx-auto p-4">{error ? <p className="text-red-600">{error}</p> : "Loading..."}</div>;
  }

  const now = new Date();
  const upcoming = occurrences.filter((o) => new Date(o.endsAt) >= now);
  const past = occurrences.filter((o) => new Date(o.endsAt) < now).reverse();
  const editable = canManage && !event.deletedAt;
  const location = formatLocation(event);

  const renderAttendees = (occurrenceId: number) => {
    const info = attendeeInfo[occurrenceId];
    if (!info) return null;
    return (
      <div className="text-sm border-t pt-2">
        <p className="text-gray-500">
          {(Object.keys(RSVP_LABELS) as RsvpStatus[]).map((s) => `${info.counts[s]} ${RSVP_LABELS[s].toLowerCase()}`).join(" · ")}
        </p>
        {info.attendees && info.attendees.length > 0 && (
          <ul className="mt-1">
            {info.attendees.map((a) => (
              <li key={a.id}>
                {a.name || a.email} <span className="text-gray-500">({RSVP_LABELS[a.rsvp].toLowerCase()})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 text-slate-800">
      <div>
        <Link className="text-blue-600 underline text-sm" href={`/groups/${event.group.id}`}>
          ← {event.group.name}
        </Link>
        <h1 className="text-3xl font-bold text-[#003262]">{event.name}</h1>
        <p className="text-gray-500 text-sm">
          {[
            event.visibility === "GROUP_ONLY" ? "Group members only" : "Public",
            RECURRENCE_LABELS[event.recurrence],
            location,
            event.maxAttendees && `Max ${event.maxAttendees} people`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {event.description && <p className="mt-2 whitespace-pre-line">{event.description}</p>}
        {event.deletedAt && <p className="mt-2 text-red-600 font-semibold">This event was deleted.</p>}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {notice && <p className="text-green-700">{notice}</p>}

      {editable && !editing && (
        <div className="flex gap-2">
          <button className="border rounded px-4 py-2" onClick={startEditing}>
            Edit event
          </button>
          <button className="border border-red-300 text-red-600 rounded px-4 py-2" onClick={handleDelete}>
            Delete event
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-2 border rounded p-3">
          <input
            className="w-full border rounded p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={150}
          />
          <textarea
            className="w-full border rounded p-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={2000}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="border rounded p-2"
              value={form.libraryId}
              onChange={(e) => setForm({ ...form, libraryId: e.target.value })}
            >
              <option value="">No library</option>
              {libraries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              className="border rounded p-2"
              placeholder="Location details"
              value={form.locationDescription}
              onChange={(e) => setForm({ ...form, locationDescription: e.target.value })}
              maxLength={255}
            />
            <input
              className="border rounded p-2"
              type="number"
              min={1}
              placeholder="Max attendees (unlimited)"
              value={form.maxAttendees}
              onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
            />
            {event.group.isPrivate && (
              <select
                className="border rounded p-2"
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}
              >
                <option value="PUBLIC">Everyone</option>
                <option value="GROUP_ONLY">Group members only</option>
              </select>
            )}
          </div>
          <p className="text-gray-500 text-sm">To change a date, use Reschedule on that date below.</p>
          <div className="flex gap-2">
            <button className="bg-[#003262] text-white rounded px-4 py-2" type="submit">
              Save
            </button>
            <button className="border rounded px-4 py-2" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Upcoming dates</h2>
        {upcoming.length === 0 && <p className="text-gray-500">No upcoming dates.</p>}
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {upcoming.map((o) => {
            const active = editable && !o.cancelledAt;
            return (
              <OccurrenceRow
                key={o.id}
                occurrence={{ ...o, event }}
                showGroup={false}
                onRsvp={event.deletedAt ? undefined : (s) => run(() => rsvp(o.id, s))}
                footer={renderAttendees(o.id)}
              >
                <button className="border rounded px-2 py-1" onClick={() => toggleAttendees(o.id)}>
                  {attendeeInfo[o.id] ? "Hide" : "Who's coming"}
                </button>
                {active && (
                  <button
                    className="border rounded px-2 py-1"
                    onClick={() => {
                      const start = toLocalInputs(o.startsAt);
                      setRescheduling({ id: o.id, date: start.date, startTime: start.time, endTime: toLocalInputs(o.endsAt).time });
                    }}
                  >
                    Reschedule
                  </button>
                )}
                {active && (
                  <button
                    className="border border-red-300 text-red-600 rounded px-2 py-1"
                    onClick={() => confirm("Cancel this date?") && run(() => cancelOccurrence(o.id), "Date cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </OccurrenceRow>
            );
          })}
        </ul>
        {rescheduling && (
          <form onSubmit={handleReschedule} className="mt-3 border rounded p-3 space-y-2">
            <h3 className="font-semibold">Reschedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="border rounded p-2"
                type="date"
                value={rescheduling.date}
                onChange={(e) => setRescheduling({ ...rescheduling, date: e.target.value })}
                required
              />
              <input
                className="border rounded p-2"
                type="time"
                value={rescheduling.startTime}
                onChange={(e) => setRescheduling({ ...rescheduling, startTime: e.target.value })}
                required
              />
              <input
                className="border rounded p-2"
                type="time"
                value={rescheduling.endTime}
                min={rescheduling.startTime}
                onChange={(e) => setRescheduling({ ...rescheduling, endTime: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-[#003262] text-white rounded px-4 py-2" type="submit">
                Save
              </button>
              <button className="border rounded px-4 py-2" type="button" onClick={() => setRescheduling(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Past dates</h2>
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {past.map((o) => (
              <OccurrenceRow key={o.id} occurrence={{ ...o, event }} showGroup={false} footer={renderAttendees(o.id)}>
                <button className="border rounded px-2 py-1" onClick={() => toggleAttendees(o.id)}>
                  {attendeeInfo[o.id] ? "Hide" : "Attendance"}
                </button>
              </OccurrenceRow>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EventPage;

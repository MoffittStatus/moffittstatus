"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EventRecurrence, EventVisibility, RECURRENCE_LABELS, createEvent, eventLibraries } from "@/lib/events";
import { Group, GroupRole, errorMessage, getGroup } from "@/lib/groups";

const plusOneHour = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h >= 23 ? "23:59" : `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const NewEventPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);

  const [group, setGroup] = useState<Group | null>(null);
  const [myRole, setMyRole] = useState<GroupRole | null>(null);
  const [libraries, setLibraries] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] = useState<EventRecurrence>("NONE");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("PUBLIC");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [libraryId, setLibraryId] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [data, libs] = await Promise.all([getGroup(groupId), eventLibraries()]);
        setGroup(data.group);
        setMyRole(data.myRole);
        setVisibility(data.group.isPrivate ? "GROUP_ONLY" : "PUBLIC");
        setLibraries(libs);
      } catch (e) {
        setError(errorMessage(e));
      }
    })();
  }, [groupId]);

  const handleStartChange = (value: string) => {
    setStartTime(value);
    // Default to a one hour event
    if (value && (!endTime || endTime <= value)) setEndTime(plusOneHour(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { event } = await createEvent({
        groupId,
        name,
        description,
        visibility,
        maxAttendees: maxAttendees ? Number(maxAttendees) : null,
        libraryId: libraryId ? Number(libraryId) : null,
        locationDescription,
        startsAt: new Date(`${date}T${startTime}`).toISOString(),
        endsAt: new Date(`${date}T${endTime}`).toISOString(),
        recurrence,
        // Repeat through the end of the chosen day
        recurrenceEnd: recurrence === "NONE" ? null : new Date(`${recurrenceEnd}T23:59:59`).toISOString(),
      });
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  if (!group) {
    return <div className="max-w-2xl mx-auto p-4">{error ? <p className="text-red-600">{error}</p> : "Loading..."}</div>;
  }
  if (myRole !== "OWNER" && myRole !== "ADMIN") {
    return <div className="max-w-2xl mx-auto p-4">Only group admins can create events.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 text-slate-800">
      <div>
        <Link className="text-blue-600 underline text-sm" href={`/groups/${groupId}`}>
          ← {group.name}
        </Link>
        <h1 className="text-3xl font-bold text-[#003262]">New event</h1>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={150}
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="text-sm">
            Date
            <input
              className="w-full border rounded p-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Start time
            <input
              className="w-full border rounded p-2"
              type="time"
              value={startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            End time
            <input
              className="w-full border rounded p-2"
              type="time"
              value={endTime}
              min={startTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Repeats
            <select
              className="w-full border rounded p-2"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as EventRecurrence)}
            >
              {(Object.keys(RECURRENCE_LABELS) as EventRecurrence[]).map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {recurrence !== "NONE" && (
            <label className="text-sm">
              Until
              <input
                className="w-full border rounded p-2"
                type="date"
                value={recurrenceEnd}
                min={date}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                required
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Library (optional)
            <select className="w-full border rounded p-2" value={libraryId} onChange={(e) => setLibraryId(e.target.value)}>
              <option value="">None</option>
              {libraries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Location details (optional)
            <input
              className="w-full border rounded p-2"
              placeholder="Room 405, 4th floor..."
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              maxLength={255}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Max attendees (optional)
            <input
              className="w-full border rounded p-2"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
            />
          </label>
          {group.isPrivate && (
            <label className="text-sm">
              Who can see it
              <select
                className="w-full border rounded p-2"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as EventVisibility)}
              >
                <option value="PUBLIC">Everyone</option>
                <option value="GROUP_ONLY">Group members only</option>
              </select>
            </label>
          )}
        </div>

        <button className="bg-[#003262] text-white rounded px-4 py-2 disabled:opacity-50" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
};

export default NewEventPage;

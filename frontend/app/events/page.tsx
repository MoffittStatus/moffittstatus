"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OccurrenceRow from "@/components/events/OccurrenceRow";
import { Occurrence, RsvpStatus, exploreEvents, myEvents, rsvp } from "@/lib/events";
import { errorMessage, isUnauthorized } from "@/lib/groups";

const EventsPage: React.FC = () => {
  const [upcoming, setUpcoming] = useState<Occurrence[]>([]);
  const [mine, setMine] = useState<Occurrence[]>([]);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setUpcoming(await exploreEvents());
      setMine(await myEvents());
      setSignedOut(false);
    } catch (e) {
      if (isUnauthorized(e)) setSignedOut(true);
      else setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRsvp = async (occurrenceId: number, status: RsvpStatus) => {
    setError("");
    try {
      await rsvp(occurrenceId, status);
      await load();
    } catch (e) {
      setError(isUnauthorized(e) ? "Sign in to RSVP" : errorMessage(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 text-slate-800">
      <div>
        <h1 className="text-3xl font-bold text-[#003262]">Events</h1>
        <p className="text-gray-500 text-sm">
          Hosted by{" "}
          <Link className="text-blue-600 underline" href="/groups">
            groups
          </Link>
          . Admins can create events from their group page.
        </p>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      {signedOut ? (
        <p>
          <a className="text-blue-600 underline" href="/login">
            Sign in
          </a>{" "}
          to RSVP and see events from your groups.
        </p>
      ) : (
        <section>
          <h2 className="text-xl font-semibold mb-2">My RSVPs</h2>
          {mine.length === 0 && <p className="text-gray-500">You haven&apos;t RSVPed to anything yet.</p>}
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {mine.map((o) => (
              <OccurrenceRow key={o.id} occurrence={o} onRsvp={(s) => handleRsvp(o.id, s)} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Upcoming</h2>
        {upcoming.length === 0 && <p className="text-gray-500">No upcoming events.</p>}
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {upcoming.map((o) => (
            <OccurrenceRow key={o.id} occurrence={o} onRsvp={signedOut ? undefined : (s) => handleRsvp(o.id, s)} />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default EventsPage;

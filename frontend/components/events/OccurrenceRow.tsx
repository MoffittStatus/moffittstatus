"use client";

import React from "react";
import Link from "next/link";
import { Occurrence, RSVP_LABELS, RsvpStatus, formatLocation, formatWhen } from "@/lib/events";

interface Props {
  occurrence: Occurrence;
  onRsvp?: (status: RsvpStatus) => void; 
  showGroup?: boolean;
  children?: React.ReactNode; // extra actions, e.g. for admins
  footer?: React.ReactNode; 
}

const OccurrenceRow: React.FC<Props> = ({ occurrence: o, onRsvp, showGroup = true, children, footer }) => {
  const event = o.event;
  const past = new Date(o.endsAt) < new Date();
  const full = event?.maxAttendees != null && o.goingCount >= event.maxAttendees && o.myRsvp !== "GOING";

  return (
    <li className={`border rounded p-3 space-y-2 ${o.cancelledAt ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {event && (
            <Link className="font-semibold text-[#003262] underline" href={`/events/${event.id}`}>
              {event.name}
            </Link>
          )}
          <p className="text-sm">
            {formatWhen(o)}
            {o.cancelledAt && <span className="text-red-600 font-semibold"> · Cancelled</span>}
          </p>
          <p className="text-gray-500 text-sm">
            {[
              showGroup && event?.group.name,
              event && formatLocation(event),
              event?.visibility === "GROUP_ONLY" && "Members only",
              `${o.goingCount}${event?.maxAttendees ? `/${event.maxAttendees}` : ""} going`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {children && <div className="flex gap-2 text-sm">{children}</div>}
      </div>

      {onRsvp && !past && !o.cancelledAt && (
        <div className="flex gap-2 text-sm">
          {(Object.keys(RSVP_LABELS) as RsvpStatus[]).map((status) => (
            <button
              key={status}
              disabled={status === "GOING" && full}
              className={`rounded px-3 py-1 border disabled:opacity-40 ${
                o.myRsvp === status ? "bg-[#003262] text-white border-[#003262]" : ""
              }`}
              onClick={() => onRsvp(status)}
            >
              {status === "GOING" && full ? "Full" : RSVP_LABELS[status]}
            </button>
          ))}
        </div>
      )}
      {footer}
    </li>
  );
};

export default OccurrenceRow;

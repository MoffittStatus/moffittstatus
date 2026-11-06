import axios from "axios";
import { BACKEND_URL } from "./apiEndPoints";
import { GroupRole } from "./groups";

export type EventVisibility = "PUBLIC" | "GROUP_ONLY";
export type EventRecurrence = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY";
export type RsvpStatus = "GOING" | "MAYBE" | "NOT_GOING";

export interface EventSummary {
  id: number;
  name: string;
  visibility: EventVisibility;
  maxAttendees: number | null;
  locationDescription: string | null;
  recurrence: EventRecurrence;
  deletedAt: string | null;
  library: { id: number; name: string } | null;
  group: { id: number; name: string };
}

export interface GroupEvent extends EventSummary {
  group: { id: number; name: string; isPrivate: boolean };
  description: string | null;
  recurrenceEnd: string | null;
  createdAt: string;
  createdBy: { id: number; name: string | null; email: string };
}

export interface Occurrence {
  id: number;
  eventId: number;
  startsAt: string;
  endsAt: string;
  cancelledAt: string | null;
  goingCount: number;
  myRsvp: RsvpStatus | null;
  event?: EventSummary; 
}

export interface Attendee {
  id: number;
  name: string | null;
  email: string;
  rsvp: RsvpStatus;
  respondedAt: string;
}

export interface NewEvent {
  groupId: number;
  name: string;
  description: string;
  visibility: EventVisibility;
  maxAttendees: number | null;
  libraryId: number | null;
  locationDescription: string;
  startsAt: string;
  endsAt: string;
  recurrence: EventRecurrence;
  recurrenceEnd: string | null;
}

export const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  NONE: "Does not repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
};

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  GOING: "Going",
  MAYBE: "Maybe",
  NOT_GOING: "Not going",
};

const eventsApi = axios.create({ baseURL: BACKEND_URL + "/api/events", withCredentials: true });

export function formatWhen(o: Pick<Occurrence, "startsAt" | "endsAt">): string {
  const start = new Date(o.startsAt);
  const end = new Date(o.endsAt);
  const day = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time(start)} – ${time(end)}`;
}

export function formatLocation(e: Pick<EventSummary, "library" | "locationDescription">): string {
  return [e.library?.name, e.locationDescription].filter(Boolean).join(" · ");
}

export const exploreEvents = async () =>
  (await eventsApi.get<{ occurrences: Occurrence[] }>("/")).data.occurrences;

export const groupEvents = async (groupId: number, when: "upcoming" | "past" = "upcoming") =>
  (await eventsApi.get<{ occurrences: Occurrence[] }>("/", { params: { groupId, when } })).data.occurrences;

export const myEvents = async () => (await eventsApi.get<{ occurrences: Occurrence[] }>("/mine")).data.occurrences;

export const eventLibraries = async () =>
  (await eventsApi.get<{ libraries: { id: number; name: string }[] }>("/libraries")).data.libraries;

export const createEvent = async (data: NewEvent) =>
  (await eventsApi.post<{ event: GroupEvent; occurrenceCount: number }>("/", data)).data;

export const getEvent = async (id: number) =>
  (
    await eventsApi.get<{ event: GroupEvent; occurrences: Occurrence[]; myRole: GroupRole | null; canManage: boolean }>(
      `/${id}`,
    )
  ).data;

export const updateEvent = (id: number, data: Partial<Omit<NewEvent, "groupId" | "startsAt" | "endsAt">>) =>
  eventsApi.patch(`/${id}`, data);

export const deleteEvent = (id: number) => eventsApi.delete(`/${id}`);

export const getOccurrence = async (occurrenceId: number) =>
  (
    await eventsApi.get<{
      occurrence: Occurrence;
      event: GroupEvent;
      counts: Record<RsvpStatus, number>;
      attendees: Attendee[] | null; // null unless you're in the group
      myRsvp: RsvpStatus | null;
      canManage: boolean;
    }>(`/occurrences/${occurrenceId}`)
  ).data;

export const rescheduleOccurrence = (occurrenceId: number, startsAt: string, endsAt: string) =>
  eventsApi.patch(`/occurrences/${occurrenceId}`, { startsAt, endsAt });

export const cancelOccurrence = (occurrenceId: number) => eventsApi.post(`/occurrences/${occurrenceId}/cancel`);

export const rsvp = (occurrenceId: number, status: RsvpStatus) =>
  eventsApi.put(`/occurrences/${occurrenceId}/rsvp`, { rsvp: status });

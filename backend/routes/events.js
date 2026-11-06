const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const {
  MANAGER_ROLES,
  PERMISSION_ERROR,
  HttpError,
  parseId,
  activeMembership,
  getGroupAccess,
} = require('../lib/groupAccess');

const router = express.Router();

// matches enums
const VISIBILITIES = ['PUBLIC', 'GROUP_ONLY'];
const RECURRENCE_STEP_DAYS = { NONE: 0, DAILY: 1, WEEKLY: 7, BIWEEKLY: 14 };
const RSVP_STATUSES = ['GOING', 'MAYBE', 'NOT_GOING'];

const TIME_ZONE = 'America/Los_Angeles';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DURATION_MS = DAY_MS;
const MAX_RECURRENCE_SPAN_MS = 366 * DAY_MS;
const MAX_OCCURRENCES = 100;

const USER_FIELDS = { id: true, name: true, email: true };

const EVENT_SUMMARY_SELECT = {
  id: true,
  name: true,
  visibility: true,
  maxAttendees: true,
  locationDescription: true,
  recurrence: true,
  deletedAt: true,
  library: { select: { id: true, name: true } },
  group: { select: { id: true, name: true } },
};

const occurrenceCounts = (user) => ({
  _count: { select: { attendees: { where: { rsvp: 'GOING' } } } },
  attendees: { where: { userId: user?.id ?? -1 }, select: { rsvp: true } },
});

function serializeOccurrence({ _count, attendees, ...occurrence }) {
  return { ...occurrence, goingCount: _count.attendees, myRsvp: attendees[0]?.rsvp ?? null };
}

function visibleEventWhere(user) {
  const visibility = [{ visibility: 'PUBLIC' }];
  if (user) visibility.push({ group: { members: { some: { userId: user.id, removedAt: null } } } });
  return { OR: visibility };
}

function parseDate(value, field) {
  const date = typeof value === 'string' ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) throw new HttpError(400, `${field} must be a valid date`);
  return date;
}

function parseTimes(body) {
  const startsAt = parseDate(body.startsAt, 'startsAt');
  const endsAt = parseDate(body.endsAt, 'endsAt');
  if (endsAt <= startsAt) throw new HttpError(400, 'The event must end after it starts');
  if (endsAt - startsAt > MAX_DURATION_MS) throw new HttpError(400, 'Events can be at most 24 hours long');
  if (endsAt < new Date()) throw new HttpError(400, 'The event cannot be in the past');
  return { startsAt, endsAt };
}

async function parseEventFields(body, { partial }) {
  const data = {};

  if (body.name !== undefined || !partial) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 150) throw new HttpError(400, 'Name is required (max 150 characters)');
    data.name = name;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      throw new HttpError(400, 'Description must be a string');
    }
    const description = body.description?.trim() || null;
    if (description && description.length > 2000) {
      throw new HttpError(400, 'Description is too long (max 2000 characters)');
    }
    data.description = description;
  }
  if (body.visibility !== undefined) {
    if (!VISIBILITIES.includes(body.visibility)) {
      throw new HttpError(400, `visibility must be one of ${VISIBILITIES.join(', ')}`);
    }
    data.visibility = body.visibility;
  }
  if (body.maxAttendees !== undefined) {
    const max = body.maxAttendees;
    if (max !== null && !(Number.isInteger(max) && max > 0 && max <= 10000)) {
      throw new HttpError(400, 'maxAttendees must be a positive whole number, or empty for unlimited');
    }
    data.maxAttendees = max;
  }
  if (body.libraryId !== undefined) {
    if (body.libraryId === null) {
      data.libraryId = null;
    } else {
      const libraryId = parseId(body.libraryId);
      const library = libraryId && (await prisma.library.findUnique({ where: { id: libraryId } }));
      if (!library) throw new HttpError(400, 'Library not found');
      data.libraryId = libraryId;
    }
  }
  if (body.locationDescription !== undefined) {
    if (body.locationDescription !== null && typeof body.locationDescription !== 'string') {
      throw new HttpError(400, 'locationDescription must be a string');
    }
    const location = body.locationDescription?.trim() || null;
    if (location && location.length > 255) throw new HttpError(400, 'Location is too long (max 255 characters)');
    data.locationDescription = location;
  }
  return data;
}

// Public groups only host public events; private groups default to group-only
function checkVisibility(group, visibility) {
  if (!group.isPrivate && visibility !== 'PUBLIC') {
    throw new HttpError(400, 'Events in a public group are always public');
  }
}

// To be PST
function tzOffsetMinutes(date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName').value;
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

function buildOccurrences({ startsAt, endsAt }, recurrence, recurrenceEnd) {
  const stepDays = RECURRENCE_STEP_DAYS[recurrence];
  if (!stepDays) return [{ startsAt, endsAt }];

  const duration = endsAt - startsAt;
  const occurrences = [];
  for (let i = 0; ; i++) {
    const naive = new Date(startsAt.getTime() + i * stepDays * DAY_MS);
    const start = new Date(naive.getTime() + (tzOffsetMinutes(startsAt) - tzOffsetMinutes(naive)) * 60000);
    if (start > recurrenceEnd) break;
    if (occurrences.length >= MAX_OCCURRENCES) {
      throw new HttpError(400, `That would create more than ${MAX_OCCURRENCES} occurrences. Pick an earlier end date.`);
    }
    occurrences.push({ startsAt: start, endsAt: new Date(start.getTime() + duration) });
  }
  return occurrences;
}

function parseRecurrence(body, startsAt) {
  const recurrence = body.recurrence ?? 'NONE';
  if (!(recurrence in RECURRENCE_STEP_DAYS)) {
    throw new HttpError(400, `recurrence must be one of ${Object.keys(RECURRENCE_STEP_DAYS).join(', ')}`);
  }
  if (recurrence === 'NONE') return { recurrence, recurrenceEnd: null };

  const recurrenceEnd = parseDate(body.recurrenceEnd, 'recurrenceEnd');
  if (recurrenceEnd < startsAt) throw new HttpError(400, 'The repeat end date must be after the first event');
  if (recurrenceEnd - startsAt > MAX_RECURRENCE_SPAN_MS) {
    throw new HttpError(400, 'Recurring events can repeat for at most one year');
  }
  return { recurrence, recurrenceEnd };
}

async function getEventAccess(rawEventId, user) {
  const eventId = parseId(rawEventId);
  const event = eventId && (await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: { select: { id: true, name: true, isPrivate: true } },
      library: { select: { id: true, name: true } },
      createdBy: { select: USER_FIELDS },
    },
  }));
  if (!event) throw new HttpError(404, 'Event not found');

  const membership = user ? await activeMembership(event.groupId, user.id) : null;
  if (event.visibility !== 'PUBLIC' && !membership && !user?.isAdmin) {
    throw new HttpError(404, 'Event not found');
  }
  return { event, membership, isManager: MANAGER_ROLES.includes(membership?.role) };
}

async function getOccurrenceAccess(rawOccurrenceId, user) {
  const occurrenceId = parseId(rawOccurrenceId);
  const occurrence = occurrenceId && (await prisma.eventOccurrence.findUnique({ where: { id: occurrenceId } }));
  if (!occurrence) throw new HttpError(404, 'Event not found');
  return { occurrence, ...(await getEventAccess(occurrence.eventId, user)) };
}

function requireManager(access) {
  if (!access.isManager) throw new HttpError(403, PERMISSION_ERROR);
}

function requireEditable(event, occurrence) {
  if (event.deletedAt) throw new HttpError(410, 'This event was deleted');
  if (occurrence?.cancelledAt) throw new HttpError(410, 'This occurrence was cancelled');
}

async function deleteEvent(tx, eventId) {
  const responses = await tx.eventAttendee.count({ where: { occurrence: { eventId } } });
  if (responses === 0) {
    await tx.event.delete({ where: { id: eventId } });
    return 'removed';
  }
  const now = new Date();
  await tx.eventOccurrence.updateMany({
    where: { eventId, cancelledAt: null, startsAt: { gt: now } },
    data: { cancelledAt: now },
  });
  await tx.event.update({ where: { id: eventId }, data: { deletedAt: now } });
  return 'archived';
}

// Explore: upcoming public events plus group-only events from your groups.
router.get('/', async (req, res) => {
  const now = new Date();
  const past = req.query.when === 'past';
  let eventWhere;

  if (req.query.groupId !== undefined) {
    const { group, membership } = await getGroupAccess(req.query.groupId, req.user);
    eventWhere = {
      groupId: group.id,
      ...(!membership && !req.user?.isAdmin && { visibility: 'PUBLIC' }),
      ...(!past && { deletedAt: null }),
    };
  } else {
    if (past) return res.status(400).json({ error: 'Past events are only listed per group' });
    eventWhere = { deletedAt: null, ...visibleEventWhere(req.user) };
  }

  const occurrences = await prisma.eventOccurrence.findMany({
    where: {
      event: eventWhere,
      ...(past ? { endsAt: { lt: now } } : { endsAt: { gte: now } }),
      ...(req.query.groupId === undefined && { cancelledAt: null }),
    },
    include: { event: { select: EVENT_SUMMARY_SELECT }, ...occurrenceCounts(req.user) },
    orderBy: { startsAt: past ? 'desc' : 'asc' },
    take: 100,
  });
  res.json({ occurrences: occurrences.map(serializeOccurrence) });
});

// Upcoming occurrences RSVP going to
router.get('/mine', requireAuth, async (req, res) => {
  const occurrences = await prisma.eventOccurrence.findMany({
    where: {
      endsAt: { gte: new Date() },
      event: { deletedAt: null, ...visibleEventWhere(req.user) },
      attendees: { some: { userId: req.user.id, rsvp: { in: ['GOING', 'MAYBE'] } } },
    },
    include: { event: { select: EVENT_SUMMARY_SELECT }, ...occurrenceCounts(req.user) },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });
  res.json({ occurrences: occurrences.map(serializeOccurrence) });
});

router.get('/libraries', async (req, res) => {
  const libraries = await prisma.library.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json({ libraries });
});

router.post('/', requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const { group, membership } = await getGroupAccess(body.groupId, req.user);
  if (!MANAGER_ROLES.includes(membership?.role)) throw new HttpError(403, PERMISSION_ERROR);

  const data = await parseEventFields(body, { partial: false });
  data.visibility ??= group.isPrivate ? 'GROUP_ONLY' : 'PUBLIC';
  checkVisibility(group, data.visibility);

  const times = parseTimes(body);
  const { recurrence, recurrenceEnd } = parseRecurrence(body, times.startsAt);
  const occurrences = buildOccurrences(times, recurrence, recurrenceEnd);

  const event = await prisma.event.create({
    data: {
      ...data,
      groupId: group.id,
      recurrence,
      recurrenceEnd,
      createdById: req.user.id,
      occurrences: { create: occurrences },
    },
  });
  res.status(201).json({ event, occurrenceCount: occurrences.length });
});

router.get('/occurrences/:occurrenceId', async (req, res) => {
  const { occurrence, event, membership, isManager } = await getOccurrenceAccess(req.params.occurrenceId, req.user);

  // Names of who's coming are only shown to group members
  const showAttendees = Boolean(membership) || req.user?.isAdmin;
  const attendees = await prisma.eventAttendee.findMany({
    where: { occurrenceId: occurrence.id },
    include: { user: { select: USER_FIELDS } },
    orderBy: { respondedAt: 'asc' },
  });
  const counts = Object.fromEntries(RSVP_STATUSES.map((s) => [s, attendees.filter((a) => a.rsvp === s).length]));

  res.json({
    occurrence,
    event,
    counts,
    attendees: showAttendees ? attendees.map((a) => ({ ...a.user, rsvp: a.rsvp, respondedAt: a.respondedAt })) : null,
    myRsvp: attendees.find((a) => a.userId === req.user?.id)?.rsvp ?? null,
    myRole: membership?.role ?? null,
    canManage: isManager,
  });
});

router.patch('/occurrences/:occurrenceId', requireAuth, async (req, res) => {
  const access = await getOccurrenceAccess(req.params.occurrenceId, req.user);
  requireManager(access);
  requireEditable(access.event, access.occurrence);
  if (access.occurrence.endsAt < new Date()) throw new HttpError(400, 'Past occurrences cannot be changed');

  const occurrence = await prisma.eventOccurrence.update({
    where: { id: access.occurrence.id },
    data: parseTimes(req.body ?? {}),
  });
  res.json({ occurrence });
});

router.post('/occurrences/:occurrenceId/cancel', requireAuth, async (req, res) => {
  const access = await getOccurrenceAccess(req.params.occurrenceId, req.user);
  requireManager(access);
  requireEditable(access.event, access.occurrence);
  if (access.occurrence.endsAt < new Date()) throw new HttpError(400, 'Past occurrences cannot be cancelled');

  const eventStatus = await prisma.$transaction(async (tx) => {
    await tx.eventOccurrence.update({
      where: { id: access.occurrence.id },
      data: { cancelledAt: new Date() },
    });
    const remaining = await tx.eventOccurrence.count({ where: { eventId: access.event.id, cancelledAt: null } });
    return remaining === 0 ? deleteEvent(tx, access.event.id) : 'active';
  });
  res.json({ ok: true, eventStatus });
});

router.put('/occurrences/:occurrenceId/rsvp', requireAuth, async (req, res) => {
  const rsvp = req.body?.rsvp;
  if (!RSVP_STATUSES.includes(rsvp)) {
    return res.status(400).json({ error: `rsvp must be one of ${RSVP_STATUSES.join(', ')}` });
  }
  const { occurrence, event } = await getOccurrenceAccess(req.params.occurrenceId, req.user);
  requireEditable(event, occurrence);
  if (occurrence.endsAt < new Date()) throw new HttpError(400, 'This event has already happened');

  const attendee = await prisma.$transaction(async (tx) => {
    if (rsvp === 'GOING' && event.maxAttendees) {
      await tx.$queryRaw`SELECT id FROM EventOccurrence WHERE id = ${occurrence.id} FOR UPDATE`;
      const going = await tx.eventAttendee.count({
        where: { occurrenceId: occurrence.id, rsvp: 'GOING', userId: { not: req.user.id } },
      });
      if (going >= event.maxAttendees) throw new HttpError(409, 'This event is full');
    }
    return tx.eventAttendee.upsert({
      where: { occurrenceId_userId: { occurrenceId: occurrence.id, userId: req.user.id } },
      create: { occurrenceId: occurrence.id, userId: req.user.id, rsvp },
      update: { rsvp, respondedAt: new Date() },
    });
  });
  res.json({ attendee });
});

router.get('/:eventId', async (req, res) => {
  const { event, membership, isManager } = await getEventAccess(req.params.eventId, req.user);
  const occurrences = await prisma.eventOccurrence.findMany({
    where: { eventId: event.id },
    include: occurrenceCounts(req.user),
    orderBy: { startsAt: 'asc' },
  });
  res.json({
    event,
    occurrences: occurrences.map(serializeOccurrence),
    myRole: membership?.role ?? null,
    canManage: isManager,
  });
});

router.patch('/:eventId', requireAuth, async (req, res) => {
  const access = await getEventAccess(req.params.eventId, req.user);
  requireManager(access);
  requireEditable(access.event);

  const data = await parseEventFields(req.body ?? {}, { partial: true });
  if (data.visibility) checkVisibility(access.event.group, data.visibility);

  const event = await prisma.event.update({ where: { id: access.event.id }, data });
  res.json({ event });
});

router.delete('/:eventId', requireAuth, async (req, res) => {
  const access = await getEventAccess(req.params.eventId, req.user);
  requireManager(access);
  requireEditable(access.event);

  const eventStatus = await prisma.$transaction((tx) => deleteEvent(tx, access.event.id));
  res.json({ ok: true, eventStatus });
});

router.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return res.status(409).json({ error: 'That already exists' });
  console.error('Events route error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = router;

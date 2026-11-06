const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const { google } = require('googleapis');

const router = express.Router();

// Google Calendar room resources
const ROOMS = [
  // Cory Hall
  { id: 'berkeley.edu_616d5a564154437a@resource.calendar.google.com', summary: 'Cory Courtyard (2nd floor)', building: 'cory', capacity: 143 },
  { id: 'berkeley.edu_37363838393439302d323634@resource.calendar.google.com', summary: '540AB Cory', building: 'cory', capacity: 46 },
  { id: 'berkeley.edu_7265736f757263652d393338@resource.calendar.google.com', summary: '521 Cory (Hogan Room)', building: 'cory', capacity: 52 },
  { id: 'berkeley.edu_7265736f757263652d393335@resource.calendar.google.com', summary: '293 Cory', building: 'cory', capacity: 30 },
  { id: 'berkeley.edu_7265736f757263652d393337@resource.calendar.google.com', summary: '400 Cory (Hughes Room)', building: 'cory', capacity: 25 },
  { id: 'berkeley.edu_7265736f757263652d393336@resource.calendar.google.com', summary: '299 Cory', building: 'cory', capacity: 25 },
  { id: 'berkeley.edu_7265736f757263652d393339@resource.calendar.google.com', summary: '531 Cory (Wang Room)', building: 'cory', capacity: 20 },
  { id: 'berkeley.edu_7265736f757263652d393433@resource.calendar.google.com', summary: '212 Cory', building: 'cory', capacity: 20 },
  { id: 'c_188da4o5vur8sj3lh2fh5qgc8cp32@resource.calendar.google.com', summary: '433 Cory', building: 'cory', capacity: 12 },
  { id: 'berkeley.edu_7265736f757263652d31343635@resource.calendar.google.com', summary: '367 Cory', building: 'cory', capacity: 12 },
  { id: 'berkeley.edu_7265736f757263652d393437@resource.calendar.google.com', summary: '258 Cory', building: 'cory', capacity: 10 },
  { id: 'berkeley.edu_547a5944535a6333@resource.calendar.google.com', summary: '529 Cory', building: 'cory', capacity: 10 },
  { id: 'berkeley.edu_3735373936323739323331@resource.calendar.google.com', summary: '557 Cory', building: 'cory', capacity: 8 },
  { id: 'berkeley.edu_7265736f757263652d393431@resource.calendar.google.com', summary: '504 Cory', building: 'cory', capacity: 8 },

// Soda Hall
{ id: 'berkeley.edu_7265736f757263652d393334@resource.calendar.google.com', summary: '430-438 Soda (Wozniak Lounge)', building: 'soda', capacity: 100 },
{ id: 'berkeley.edu_7265736f757263652d393231@resource.calendar.google.com', summary: '306 Soda (HP Auditorium)', building: 'soda', capacity: 98 },
{ id: 'berkeley.edu_7265736f757263652d393233@resource.calendar.google.com', summary: '310 Soda', building: 'soda', capacity: 45 },
{ id: 'berkeley.edu_7265736f757263652d393236@resource.calendar.google.com', summary: '405 Soda', building: 'soda', capacity: 40 },
{ id: 'berkeley.edu_7265736f757263652d393235@resource.calendar.google.com', summary: '380 Soda', building: 'soda', capacity: 35 },
{ id: 'berkeley.edu_7265736f757263652d393232@resource.calendar.google.com', summary: '320 Soda', building: 'soda', capacity: 30 },
{ id: 'berkeley.edu_7265736f757263652d393237@resource.calendar.google.com', summary: '606 Soda', building: 'soda', capacity: 24 },
{ id: 'berkeley.edu_7265736f757263652d393234@resource.calendar.google.com', summary: '373 Soda', building: 'soda', capacity: 20 },
{ id: 'berkeley.edu_7265736f757263652d393239@resource.calendar.google.com', summary: '511 Soda', building: 'soda', capacity: 15 },
{ id: 'berkeley.edu_7265736f757263652d393238@resource.calendar.google.com', summary: '411 Soda', building: 'soda', capacity: 15 },
{ id: 'berkeley.edu_1884n7u3dk5fmh46k5gaonn9ciuo66g89hn4kt9me9478@resource.calendar.google.com', summary: '347 Soda', building: 'soda', capacity: 12 },
{ id: 'berkeley.edu_7265736f757263652d393435@resource.calendar.google.com', summary: '326 Soda', building: 'soda', capacity: 10 },
{ id: 'berkeley.edu_6b6b386a4c684351@resource.calendar.google.com', summary: '341B Soda', building: 'soda', capacity: 10 },
{ id: 'berkeley.edu_7265736f757263652d393739@resource.calendar.google.com', summary: '283E Soda', building: 'soda', capacity: 8 },
{ id: 'berkeley.edu_7265736f757263652d393830@resource.calendar.google.com', summary: '283H Soda', building: 'soda', capacity: 5 },
{ id: 'berkeley.edu_2d31313238353338332d333635@resource.calendar.google.com', summary: '734 Soda', building: 'soda', capacity: 4 },
{ id: 'berkeley.edu_3832313633313436353937@resource.calendar.google.com', summary: '732 Soda', building: 'soda', capacity: 3 },
];

const TIME_ZONE = 'America/Los_Angeles';
const ALLOWED_DOMAIN = 'berkeley.edu';
const SESSION_COOKIE = 'ms_gcal_session';

// Bookable window in minutes after midnight, split into slots
const DAY_START = 8 * 60;
const DAY_END = 22 * 60;
const SLOT_MINUTES = 30;

// Google access tokens last an hour and we don't request refresh tokens, so the session ends with them
const SESSION_MAX_AGE_MS = 55 * 60 * 1000;

const FIELD_LIMITS = { title: 200, description: 2000, affiliation: 200, speakers: 1000 };

const isConfigured = () => Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.SESSION_SECRET
);

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3003/api/auth/callback/google'
  );
}

function getAuthenticatedClient(req) {
  if (!req.session.tokens) return null;
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(req.session.tokens);
  return oauth2Client;
}

// How far ahead of UTC Los Angeles is at the given instant, in ms (changes with daylight saving)
function timeZoneOffsetMs(instant) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(instant);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// Convert a Los Angeles wall-clock date and minutes after midnight to the actual instant
function campusTime(date, minutes) {
  const guess = new Date(new Date(`${date}T00:00:00Z`).getTime() + minutes * 60 * 1000);
  const firstPass = new Date(guess.getTime() - timeZoneOffsetMs(guess));
  return new Date(guess.getTime() - timeZoneOffsetMs(firstPass));
}

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

const pad = (value) => String(value).padStart(2, '0');
const toClock = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// "09:30" to minutes after midnight, or NaN if it isn't on a slot boundary
function parseClock(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return NaN;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes % SLOT_MINUTES === 0 ? minutes : NaN;
}

const overlaps = (busy, start, end) => new Date(busy.start) < end && new Date(busy.end) > start;

// The UI strips parentheses from room names, so keep labels like "Hogan Room" outside of them
const displayName = (room) => `${room.summary.replace(/\s*\((.*?)\)/, ' - $1')} (Capacity ${room.capacity})`;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Read busy times, leaving out any room Google wouldn't let this account see
async function queryBusy(auth, rooms, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });
  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: TIME_ZONE,
      items: rooms.map((r) => ({ id: r.id })),
    },
  });

  const busyByRoom = new Map();
  for (const room of rooms) {
    const result = fb.data.calendars?.[room.id];
    if (result && !result.errors?.length) busyByRoom.set(room.id, result.busy || []);
  }
  return busyByRoom;
}

// Free slots per room, in the same shape the LibCal rooms use so the booking UI can share them
async function getAvailableSlots(auth, building, date) {
  const rooms = ROOMS.filter((r) => r.building === building);
  const busyByRoom = await queryBusy(auth, rooms, campusTime(date, DAY_START), campusTime(date, DAY_END));
  if (busyByRoom.size === 0) {
    throw httpError(403, 'Could not read any room calendars with this account');
  }

  const now = new Date();
  const slots = [];
  for (const room of rooms) {
    const busy = busyByRoom.get(room.id);
    if (!busy) continue;

    for (let minutes = DAY_START; minutes < DAY_END; minutes += SLOT_MINUTES) {
      const start = campusTime(date, minutes);
      const end = campusTime(date, minutes + SLOT_MINUTES);
      if (start <= now || busy.some((b) => overlaps(b, start, end))) continue;

      slots.push({
        id: room.id,
        name: displayName(room),
        time: `${date} ${toClock(minutes)}:00 - ${date} ${toClock(minutes + SLOT_MINUTES)}:00`,
        checksum: '',
        librarySlug: building,
      });
    }
  }
  return slots;
}

// Returns an error message, or null if the booking request is well formed
function validateBooking(body, room) {
  if (!room) return 'Unknown room';
  if (!isValidDate(body.date)) return 'Invalid date';

  const startMinutes = parseClock(body.startTime);
  const endMinutes = parseClock(body.endTime);
  if (!(startMinutes >= DAY_START && startMinutes < DAY_END)) return 'Invalid start time';
  if (!(endMinutes > startMinutes && endMinutes <= DAY_END)) return 'Invalid end time';
  if (campusTime(body.date, startMinutes) <= new Date()) return 'That time has already passed';

  for (const field of ['title', 'description', 'affiliation']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) return `Missing ${field}`;
  }
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > limit)) {
      return `${field} must be text of at most ${limit} characters`;
    }
  }

  const participants = Number(body.participants);
  if (!Number.isInteger(participants) || participants < 1) return 'Number of participants is required';
  if (participants > room.capacity) return `This room only holds ${room.capacity} people`;
  return null;
}

// Create the event on the user's calendar and invite the room
async function createCalendarBooking(auth, room, body) {
  const start = campusTime(body.date, parseClock(body.startTime));
  const end = campusTime(body.date, parseClock(body.endTime));

  const busyByRoom = await queryBusy(auth, [room], start, end);
  const busy = busyByRoom.get(room.id);
  if (!busy) {
    throw httpError(403, "Could not read this room's calendar with your account");
  }
  if (busy.some((b) => overlaps(b, start, end))) {
    throw httpError(409, 'That time was just taken. Please pick another time.');
  }

  const description =
    `Event description: ${body.description}\n` +
    `EECS Affiliation: ${body.affiliation}\n` +
    `Number of participants: ${body.participants}\n` +
    `Speaker list and affiliation: ${body.speakers || 'N/A'}`;

  const calendar = google.calendar({ version: 'v3', auth });
  const created = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'none', // don't notify guests until booking is confirmed by room scheduler
    requestBody: {
      summary: body.title,
      description,
      location: room.summary,
      start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
      end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
      attendees: [{ email: room.id, resource: true }],
    },
  });

  const roomAttendee = (created.data.attendees || []).find((a) => a.email === room.id);
  return {
    eventId: created.data.id,
    htmlLink: created.data.htmlLink,
    status: created.data.status,
    // Stays 'needsAction' until the room accepts, so the event isn't a confirmed reservation yet
    roomResponse: roomAttendee?.responseStatus || 'needsAction',
  };
}

// Maps failures from Google to a response, ending the session if the sign-in is no longer valid
function sendGoogleError(req, res, error, label) {
  console.error(`${label} error:`, error.message);
  const status = Number(error.status || error.code || error.response?.status);
  if (status === 401) {
    return req.session.destroy(() => {
      res.status(401).json({ error: 'Your Google sign-in expired. Please sign in again.' });
    });
  }
  if (status === 403 || status === 409) {
    return res.status(status).json({ error: error.message });
  }
  return res.status(502).json({ error: 'Google Calendar request failed. Please try again.' });
}

// Only send people back to the room booking page after signing in
const safeReturnTo = (value) => (/^\/rooms(\?[^\s\\]*)?$/.test(value || '') ? value : '/rooms');
const frontendUrl = (path) => `${process.env.FRONTEND_URL || ''}${path}`;
const withError = (path, code) => `${path}${path.includes('?') ? '&' : '?'}gcal_error=${code}`;

// GET /api/gcal/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GCal API is running', configured: isConfigured() });
});

// Everything below needs Google credentials and a session
const sessionMiddleware = isConfigured()
  ? session({
    name: SESSION_COOKIE,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // deployed behind nginx
    cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: SESSION_MAX_AGE_MS },
  })
  : (req, res) => res.status(503).json({ error: 'Google Calendar booking is not set up on this server.' });

router.use(sessionMiddleware);

// GET /api/gcal/login - Initiate OAuth flow
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(24).toString('hex');
  req.session.oauthState = state;
  req.session.returnTo = safeReturnTo(req.query.returnTo);

  const authorizationUrl = getOAuth2Client().generateAuthUrl({
    access_type: 'online',
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/calendar.freebusy',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    hd: ALLOWED_DOMAIN,
    state,
  });

  res.redirect(authorizationUrl);
});

// GET /api/auth/callback/google - Handle OAuth callback, at the redirect URI registered with Google
const callbackRouter = express.Router();
callbackRouter.use(sessionMiddleware);
callbackRouter.get('/', async (req, res) => {
  const { code, state, error } = req.query;
  const returnTo = safeReturnTo(req.session.returnTo);
  const expectedState = req.session.oauthState;
  delete req.session.oauthState;
  delete req.session.returnTo;

  if (!expectedState || state !== expectedState) {
    return res.redirect(frontendUrl(withError(returnTo, 'state')));
  }
  if (error || !code) {
    return res.redirect(frontendUrl(withError(returnTo, 'denied')));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // The hd parameter on the login URL is only a hint, so check the signed token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (payload.hd !== ALLOWED_DOMAIN || !payload.email_verified) {
      return res.redirect(frontendUrl(withError(returnTo, 'domain')));
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });
    req.session.tokens = { access_token: tokens.access_token, expiry_date: tokens.expiry_date };
    req.session.email = payload.email;
    res.redirect(frontendUrl(returnTo));
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(frontendUrl(withError(returnTo, 'failed')));
  }
});

// POST /api/gcal/logout - Clear session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie(SESSION_COOKIE);
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/gcal/me - Check if user is authenticated
router.get('/me', (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, email: req.session.email });
});

// GET /api/gcal/availability?building=cory&date=YYYY-MM-DD
router.get('/availability', async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated. Please login first.' });
  }

  const { building, date } = req.query;
  if (!ROOMS.some((r) => r.building === building)) {
    return res.status(400).json({ error: 'Unknown building' });
  }
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  try {
    const slots = await getAvailableSlots(auth, building, date);
    res.json({ email: req.session.email, slots });
  } catch (error) {
    sendGoogleError(req, res, error, 'GET /availability');
  }
});

// POST /api/gcal/book
router.post('/book', async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated. Please login first.' });
  }

  const body = req.body || {};
  const room = ROOMS.find((r) => r.id === body.roomId);
  const invalid = validateBooking(body, room);
  if (invalid) {
    return res.status(400).json({ error: invalid });
  }

  try {
    const result = await createCalendarBooking(auth, room, body);
    res.json(result);
  } catch (error) {
    sendGoogleError(req, res, error, 'POST /book');
  }
});

module.exports = router;
module.exports.callbackRouter = callbackRouter;

const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

// Load Google OAuth credentials
const keys = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/gcal/oauth2callback'],
};

try {
  const fileData = fs.readFileSync(CLIENT_SECRETS_FILE, 'utf8');
  keys = JSON.parse(fileData).web || JSON.parse(fileData).installed;
} catch (error) {
  console.warn('Could not load client_secret.json. OAuth will not work.', error.message);
}

function getOAuth2Client() {
  return new google.auth.OAuth2(keys.client_id, keys.client_secret, keys.redirect_uris[0]);
}

function getAuthenticatedClient(req) {
  if (!req.session || !req.session.tokens) return null;
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(req.session.tokens);
  return oauth2Client;
}

// Get available rooms for a building
async function searchAvailableRooms(auth, building, startStr, endStr) {
  try {
    console.log(`Fetching room calendars for building: ${building}...`);

    // Filter from hardcoded list, skipping rooms without a resource email yet
    const rooms = ROOMS.filter(
      (r) => r.building === building.toLowerCase() && r.id !== null
    );

    console.log(`Found ${rooms.length} configured rooms matching building.`);

    if (!rooms.length || !startStr || !endStr) {
      return rooms;
    }

    console.log(`Checking freebusy status from ${startStr} to ${endStr}...`);
    const calendar = google.calendar({ version: 'v3', auth });

    const freebusyBody = {
      timeMin: startStr,
      timeMax: endStr,
      items: rooms.map((r) => ({ id: r.id })),
    };

    const fb = await calendar.freebusy.query({ requestBody: freebusyBody });
    const calendars = fb.data.calendars || {};

    return rooms.map((room) => {
      const busy = calendars[room.id]?.busy || [];
      return {
        id: room.id,
        summary: room.summary,
        capacity: room.capacity,
        available: busy.length === 0,
        busy_slots: busy,
      };
    });
  } catch (error) {
    console.error('searchAvailableRooms error:', error.message);
    throw error;
  }
}

// Create Google Calendar Booking
async function createCalendarBooking(auth, bookingData) {
  try {
    console.log(`Creating event for room ${bookingData.roomId}...`);
    const calendar = google.calendar({ version: 'v3', auth });

    if (!bookingData.title || !bookingData.description) {
      throw new Error('Event title and description are required');
    }

    const description =
      `Event description: ${bookingData.description}\n` +
      `EECS Affiliation: ${bookingData.affiliation || ''}\n` +
      `Number of participants: ${bookingData.participants || ''}\n` +
      `Speaker list and affiliation: ${bookingData.speakers || 'N/A'}`;
    const start = new Date(bookingData.startTime).toISOString();
    const end = new Date(bookingData.endTime).toISOString();

    const event = {
      summary: bookingData.title,
      description: description,
      start: { dateTime: start, timeZone: 'America/Los_Angeles' },
      end: { dateTime: end, timeZone: 'America/Los_Angeles' },
      attendees: [{ email: bookingData.roomId }],
    };

    const created = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'none', // don't notify guests until booking is confirmed by room scheduler
    });

    if (created.status < 200 || created.status >= 300) {
      throw new Error(`Google API returned ${created.status}`);
    }

    return {
      eventId: created.data.id,
      htmlLink: created.data.htmlLink,
      // 'tentative' means pending room scheduler approval — not yet confirmed
      status: created.data.status,
    };
  } catch (error) {
    console.error('createCalendarBooking error:', error.message);
    throw error;
  }
}

// GET /api/gcal/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GCal API is running' });
});

// GET /api/gcal/login - Initiate OAuth flow
router.get('/login', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  });

  res.redirect(authorizationUrl);
});

// GET /api/gcal/oauth2callback - Handle OAuth callback
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in session
    req.session.tokens = tokens;

    console.log('OAuth successful, tokens stored in session');

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/rooms`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/gcal/logout - Clear session
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/gcal/rooms
router.get('/rooms', async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated. Please login first.' });
  }

  const { building = 'cory', start, end } = req.query;

  try {
    const rooms = await searchAvailableRooms(auth, building, start, end);
    res.json(rooms);
  } catch (error) {
    console.error('GET /rooms error:', error.message);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/gcal/me - Check if user is authenticated
router.get('/me', (req, res) => {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true });
});

// POST /api/gcal/book
router.post('/book', async (req, res) => {
  const auth = getAuthenticatedClient(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated. Please login first.' });
  }

  try {
    const result = await createCalendarBooking(auth, req.body);
    res.json(result);
  } catch (error) {
    console.error('POST /book error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
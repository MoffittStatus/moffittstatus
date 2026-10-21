const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const SESSION_COOKIE = 'ms_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProd = process.env.NODE_ENV === 'production';

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };
}

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.SESSION_SECRET, {
    expiresIn: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
  res.cookie(SESSION_COOKIE, token, { ...baseCookieOptions(), maxAge: SESSION_MAX_AGE_MS });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, baseCookieOptions());
}

// Fields exposed as req.user and returned by /api/auth/me
const PUBLIC_USER_FIELDS = { id: true, email: true, name: true, picture: true, isAdmin: true };

// Runs on every /api request: if a valid session cookie is present, sets req.user.
// Never rejects a request on its own — use requireAuth for that.
async function attachUser(req, res, next) {
  req.user = null;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token || !process.env.SESSION_SECRET) return next();

  let userId;
  try {
    userId = Number(jwt.verify(token, process.env.SESSION_SECRET).sub);
  } catch (err) {
    // Expired or tampered token
    clearSessionCookie(res);
    return next();
  }

  try {
    // Looked up each request so isAdmin changes / deleted users take effect immediately
    req.user = await prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_FIELDS,
    });
    if (!req.user) clearSessionCookie(res);
  } catch (err) {
    // DB hiccup: treat as signed out for this request but keep the cookie
    console.error('attachUser lookup failed:', err.message);
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = {
  attachUser,
  requireAuth,
  requireAdmin,
  setSessionCookie,
  clearSessionCookie,
  baseCookieOptions,
  PUBLIC_USER_FIELDS,
};

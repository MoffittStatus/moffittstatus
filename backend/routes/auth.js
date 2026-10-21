const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../lib/prisma');
const {
  setSessionCookie,
  clearSessionCookie,
  baseCookieOptions,
  PUBLIC_USER_FIELDS,
} = require('../middleware/auth');

const router = express.Router();

const ALLOWED_DOMAIN = 'berkeley.edu';
const STATE_COOKIE = 'ms_oauth_state';
const RETURN_TO_COOKIE = 'ms_oauth_return';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const env = (key) => (process.env[key] || '').trim();
const frontendUrl = () => env('FRONTEND_URL') || 'http://localhost:3003';
const redirectUri = () =>
  env('GOOGLE_REDIRECT_URI') || 'http://localhost:8000/api/auth/callback/google';

function isConfigured() {
  return env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET') && env('SESSION_SECRET');
}

function getOAuthClient() {
  return new OAuth2Client(env('GOOGLE_CLIENT_ID'), env('GOOGLE_CLIENT_SECRET'), redirectUri());
}

// Only allow same-site relative paths ("/groups"), never "//evil.com" or absolute URLs
function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}

function redirectToLogin(res, error) {
  res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(error)}`);
}

// GET /api/auth/google?returnTo=/groups — start the Google sign-in flow
router.get('/google', (req, res) => {
  if (!isConfigured()) {
    return res.status(500).json({ error: 'Google auth is not configured on the server' });
  }

  const state = crypto.randomBytes(32).toString('hex');
  const cookieOpts = { ...baseCookieOptions(), maxAge: STATE_MAX_AGE_MS };
  res.cookie(STATE_COOKIE, state, cookieOpts);
  res.cookie(RETURN_TO_COOKIE, safeReturnTo(req.query.returnTo), cookieOpts);

  const url = getOAuthClient().generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    hd: ALLOWED_DOMAIN, // only a hint for Google's account picker; enforced in the callback
    prompt: 'select_account',
    state,
  });
  res.redirect(url);
});

// GET /api/auth/callback/google — Google redirects here after sign-in
router.get('/callback/google', async (req, res) => {
  const { code, state, error } = req.query;
  const expectedState = req.cookies?.[STATE_COOKIE];
  const returnTo = safeReturnTo(req.cookies?.[RETURN_TO_COOKIE]);
  res.clearCookie(STATE_COOKIE, baseCookieOptions());
  res.clearCookie(RETURN_TO_COOKIE, baseCookieOptions());

  if (error) return redirectToLogin(res, 'cancelled');
  if (!isConfigured()) return redirectToLogin(res, 'server');
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToLogin(res, 'state');
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase();

    if (!payload.email_verified || payload.hd !== ALLOWED_DOMAIN || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return redirectToLogin(res, 'domain');
    }

    const profile = {
      googleId: payload.sub,
      name: payload.name || null,
      picture: payload.picture || null,
      lastLoginAt: new Date(),
    };
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, ...profile },
      update: profile,
      select: { id: true },
    });

    setSessionCookie(res, user.id);
    res.redirect(`${frontendUrl()}${returnTo}`);
  } catch (err) {
    console.error('Google auth callback error:', err.message);
    redirectToLogin(res, 'server');
  }
});

// GET /api/auth/me — current user, or { user: null } when signed out
router.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

module.exports = router;

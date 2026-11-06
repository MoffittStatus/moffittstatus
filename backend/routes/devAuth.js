// DEV ONLY: fake sign-in for testing features before real auth is wired up.
// Mounted only when DEV_AUTH=true and NODE_ENV !== 'production' (see index.js).
//   GET /api/dev/login?email=oski@berkeley.edu[&admin=1]  -> signs you in as that user (creates them if needed)
//   GET /api/dev/logout
//   GET /api/dev/me
const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const DEV_COOKIE = 'ms_dev_user';
const cookieOptions = { httpOnly: true, sameSite: 'lax', path: '/' };

function readCookie(req, name) {
  const match = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// Sets req.user from the dev cookie, like the real attachUser middleware will
router.use(async (req, res, next) => {
  const raw = readCookie(req, DEV_COOKIE);
  if (!raw) return next();
  try {
    const { id, isAdmin } = JSON.parse(raw);
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
    req.user = user ? { ...user, isAdmin: Boolean(isAdmin) } : null;
  } catch (err) {
    req.user = null;
  }
  next();
});

router.get('/dev/login', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email.includes('@')) return res.status(400).json({ error: 'Pass ?email=someone@berkeley.edu' });

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: email.split('@')[0] },
    update: {},
  });
  const isAdmin = req.query.admin === '1';
  res.cookie(DEV_COOKIE, JSON.stringify({ id: user.id, isAdmin }), cookieOptions);
  res.json({ signedInAs: { id: user.id, email: user.email, isAdmin } });
});

router.get('/dev/logout', (req, res) => {
  res.clearCookie(DEV_COOKIE, cookieOptions);
  res.json({ ok: true });
});

router.get('/dev/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendGroupInviteEmail } = require('../lib/mailer');

const router = express.Router();

const ALLOWED_EMAIL_DOMAIN = 'berkeley.edu';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// matches enums
const GROUP_TYPES = ['RSO', 'CASUAL'];
const INVITABLE_ROLES = ['ADMIN', 'MEMBER'];
const MANAGER_ROLES = ['OWNER', 'ADMIN'];

const frontendUrl = () => (process.env.FRONTEND_URL || '').trim() || 'http://localhost:3003';

const MEMBER_USER_FIELDS = { id: true, name: true, email: true };

const inviteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Validates the editable group fields; `partial` allows omitting any of them (for PATCH)
function parseGroupFields(body, { partial }) {
  const data = {};

  if (body.name !== undefined || !partial) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) throw new HttpError(400, 'Name is required (max 100 characters)');
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
  if (body.isPrivate !== undefined) {
    if (typeof body.isPrivate !== 'boolean') throw new HttpError(400, 'isPrivate must be true or false');
    data.isPrivate = body.isPrivate;
  }
  if (body.type !== undefined) {
    if (!GROUP_TYPES.includes(body.type)) throw new HttpError(400, `type must be one of ${GROUP_TYPES.join(', ')}`);
    data.type = body.type;
  }
  return data;
}

function activeMembership(groupId, userId) {
  return prisma.groupMember.findFirst({
    where: { groupId, userId, removedAt: null },
  });
}

// Loads req.group and req.membership (the signed-in user's active membership, or null).
// Private groups 404 for non-members so their existence isn't leaked.
async function loadGroup(req, res, next) {
  const groupId = parseId(req.params.id);
  if (!groupId) return res.status(404).json({ error: 'Group not found' });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: 'Group not found' });

  req.membership = req.user ? await activeMembership(groupId, req.user.id) : null;
  if (group.isPrivate && !req.membership && !req.user?.isAdmin) {
    return res.status(404).json({ error: 'Group not found' });
  }
  req.group = group;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      return res.status(403).json({ error: 'You do not have permission. If you think this is an error, contact your group admin.' });
    }
    next();
  };
}

async function addMember(tx, groupId, userId, role) {
  const existing = await tx.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!existing) {
    return tx.groupMember.create({ data: { groupId, userId, role } });
  }
  if (existing.removedAt) {
    return tx.groupMember.update({
      where: { id: existing.id },
      data: { role, removedAt: null, joinedAt: new Date() },
    });
  }

  // Already an active member: an admin invite can promote, but never demote
  if (role === 'ADMIN' && existing.role === 'MEMBER') {
    return tx.groupMember.update({ where: { id: existing.id }, data: { role } });
  }
  return existing;
  
  // TO DO: Admin can demote a member? or only owner?
}

function loadPendingInvite(token) {
  if (typeof token !== 'string' || token.length !== 64) return null;
  return prisma.groupInvite.findUnique({
    where: { token },
    include: {
      group: { select: { id: true, name: true, description: true, isPrivate: true, type: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

function inviteProblem(invite, user) {
  if (!invite) return [404, 'Invite not found'];
  if (invite.status !== 'PENDING') return [410, `This invite was already ${invite.status.toLowerCase()}`];
  if (invite.expiresAt < new Date()) return [410, 'This invite has expired'];
  if (invite.email !== user.email.toLowerCase()) {
    return [403, `This invite was sent to ${invite.email}. Sign in with that account to respond.`];
  }
  return null;
}

router.post('/', requireAuth, async (req, res) => {
  const data = parseGroupFields(req.body ?? {}, { partial: false });
  const group = await prisma.group.create({
    data: {
      ...data,
      createdById: req.user.id,
      members: { create: { userId: req.user.id, role: 'OWNER' } },
    },
  });
  res.status(201).json({ group });
});

// groups you belong to and public groups
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const visibility = [{ isPrivate: false }];
  if (req.user) visibility.push({ members: { some: { userId: req.user.id, removedAt: null } } });

  const groups = await prisma.group.findMany({
    where: {
      OR: visibility,
      ...(q && { name: { contains: q } }),
    },
    include: { _count: { select: { members: { where: { removedAt: null } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({
    groups: groups.map(({ _count, ...group }) => ({ ...group, memberCount: _count.members })),
  });
});

// your groups
router.get('/mine', requireAuth, async (req, res) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.user.id, removedAt: null },
    include: { group: true },
    orderBy: { joinedAt: 'desc' },
  });
  res.json({
    groups: memberships.map((m) => ({ ...m.group, role: m.role, joinedAt: m.joinedAt })),
  });
});


router.get('/invites/mine', requireAuth, async (req, res) => {
  const invites = await prisma.groupInvite.findMany({
    where: {
      email: req.user.email.toLowerCase(),
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      group: { select: { id: true, name: true, type: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ invites });
});

// for invite email
router.get('/invites/:token', requireAuth, async (req, res) => {
  const invite = await loadPendingInvite(req.params.token);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });

  const { token, ...rest } = invite;
  res.json({
    invite: {
      ...rest,
      expired: invite.expiresAt < new Date(),
      emailMatches: invite.email === req.user.email.toLowerCase(),
    },
  });
});

router.post('/invites/:token/accept', requireAuth, async (req, res) => {
  const invite = await loadPendingInvite(req.params.token);
  const problem = inviteProblem(invite, req.user);
  if (problem) return res.status(problem[0]).json({ error: problem[1] });

  const membership = await prisma.$transaction(async (tx) => {
    const { count } = await tx.groupInvite.updateMany({
      where: { id: invite.id, status: 'PENDING' },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    if (count === 0) throw new HttpError(410, 'This invite was already used');
    return addMember(tx, invite.groupId, req.user.id, invite.role);
  });
  res.json({ groupId: invite.groupId, membership });
});

router.post('/invites/:token/reject', requireAuth, async (req, res) => {
  const invite = await loadPendingInvite(req.params.token);
  const problem = inviteProblem(invite, req.user);
  if (problem) return res.status(problem[0]).json({ error: problem[1] });

  await prisma.groupInvite.update({
    where: { id: invite.id },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });
  res.json({ ok: true });
});

router.get('/:id', loadGroup, async (req, res) => {
  const members = await prisma.groupMember.findMany({
    where: { groupId: req.group.id, removedAt: null },
    include: { user: { select: MEMBER_USER_FIELDS } },
    orderBy: { joinedAt: 'asc' },
  });
  res.json({
    group: req.group,
    members: members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt })),
    myRole: req.membership?.role ?? null,
  });
});


router.patch('/:id', requireAuth, loadGroup, requireRole(...MANAGER_ROLES), async (req, res) => {
  const data = parseGroupFields(req.body ?? {}, { partial: true });
  // Verification applies to a specific RSO, so changing the type clears it
  if (data.type && data.type !== req.group.type) data.verified = false;

  const group = await prisma.group.update({ where: { id: req.group.id }, data });
  res.json({ group });
});

router.patch('/:id/verify', requireAdmin, loadGroup, async (req, res) => {
  if (typeof req.body?.verified !== 'boolean') {
    return res.status(400).json({ error: 'verified must be true or false' });
  }
  if (req.group.type !== 'RSO') {
    return res.status(400).json({ error: 'Only RSO groups can be verified' });
  }
  const group = await prisma.group.update({
    where: { id: req.group.id },
    data: { verified: req.body.verified },
  });
  res.json({ group });
});

router.post('/:id/join', requireAuth, loadGroup, async (req, res) => {
  if (req.group.isPrivate) {
    return res.status(403).json({ error: 'This group is private. You need an invite to join.' });
  }
  if (req.membership) return res.status(409).json({ error: 'You are already a member' });

  const membership = await prisma.$transaction((tx) => addMember(tx, req.group.id, req.user.id, 'MEMBER'));
  res.status(201).json({ membership });
});

router.post('/:id/leave', requireAuth, loadGroup, async (req, res) => {
  if (!req.membership) return res.status(400).json({ error: 'You are not a member' });
  if (req.membership.role === 'OWNER') {
    return res.status(400).json({ error: 'Transfer ownership to an admin before leaving' });
  }
  await prisma.groupMember.update({
    where: { id: req.membership.id },
    data: { removedAt: new Date() },
  });
  res.json({ ok: true });
});

router.post('/:id/invites', inviteLimiter, requireAuth, loadGroup, requireRole(...MANAGER_ROLES), async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const role = req.body?.role ?? 'MEMBER';

  if (!/^[^\s@]+@[^\s@]+$/.test(email) || !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return res.status(400).json({ error: `Enter a valid @${ALLOWED_EMAIL_DOMAIN} email` });
  }
  if (!INVITABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${INVITABLE_ROLES.join(', ')}` });
  }
  if (role === 'ADMIN' && req.membership.role !== 'OWNER') {
    return res.status(403).json({ error: 'Only the owner can invite admins' });
  }

  const existingMember = await prisma.groupMember.findFirst({
    where: { groupId: req.group.id, removedAt: null, user: { email } },
  });
  if (existingMember) return res.status(409).json({ error: 'That person is already a member' });

  const invite = await prisma.$transaction(async (tx) => {
    // Re-inviting replaces any earlier pending invite so only the newest link works
    await tx.groupInvite.updateMany({
      where: { groupId: req.group.id, email, status: 'PENDING' },
      data: { status: 'REVOKED', respondedAt: new Date() },
    });
    return tx.groupInvite.create({
      data: {
        groupId: req.group.id,
        email,
        role,
        token: crypto.randomBytes(32).toString('hex'),
        createdById: req.user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
  });

  let emailSent = true;
  try {
    await sendGroupInviteEmail({
      to: email,
      groupName: req.group.name,
      inviterName: req.user.name || req.user.email,
      role,
      link: `${frontendUrl()}/groups/invite/${invite.token}`,
    });
  } catch (err) {
    console.error('Failed to send group invite email:', err.message);
    emailSent = false;
  }

  const { token, ...inviteWithoutToken } = invite;
  res.status(201).json({ invite: inviteWithoutToken, emailSent });
});

router.get('/:id/invites', requireAuth, loadGroup, requireRole(...MANAGER_ROLES), async (req, res) => {
  const invites = await prisma.groupInvite.findMany({
    where: { groupId: req.group.id, status: 'PENDING', expiresAt: { gt: new Date() } },
    select: {
      id: true, email: true, role: true, status: true, createdAt: true, expiresAt: true,
      createdBy: { select: MEMBER_USER_FIELDS },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ invites });
});

router.delete('/:id/invites/:inviteId', requireAuth, loadGroup, requireRole(...MANAGER_ROLES), async (req, res) => {
  const inviteId = parseId(req.params.inviteId);
  const { count } = await prisma.groupInvite.updateMany({
    where: { id: inviteId ?? -1, groupId: req.group.id, status: 'PENDING' },
    data: { status: 'REVOKED', respondedAt: new Date() },
  });
  if (count === 0) return res.status(404).json({ error: 'Pending invite not found' });
  res.json({ ok: true });
});

async function loadTargetMember(req, rawUserId) {
  const userId = parseId(rawUserId);
  if (!userId) throw new HttpError(404, 'Member not found');
  if (userId === req.user.id) throw new HttpError(400, 'You cannot change your own membership here');
  const target = await activeMembership(req.group.id, userId);
  if (!target) throw new HttpError(404, 'Member not found');
  if (target.role === 'OWNER') throw new HttpError(403, 'The owner cannot be changed. Use transfer ownership.');
  return target;
}

router.patch('/:id/members/:userId', requireAuth, loadGroup, requireRole('OWNER'), async (req, res) => {
  const role = req.body?.role;
  if (!INVITABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${INVITABLE_ROLES.join(', ')}` });
  }
  const target = await loadTargetMember(req, req.params.userId);
  const membership = await prisma.groupMember.update({ where: { id: target.id }, data: { role } });
  res.json({ membership });
});

router.delete('/:id/members/:userId', requireAuth, loadGroup, requireRole(...MANAGER_ROLES), async (req, res) => {
  const target = await loadTargetMember(req, req.params.userId);
  if (req.membership.role === 'ADMIN' && target.role !== 'MEMBER') {
    return res.status(403).json({ error: 'Only the owner can remove admins' });
  }
  await prisma.groupMember.update({
    where: { id: target.id },
    data: { removedAt: new Date() },
  });
  res.json({ ok: true });
});

router.post('/:id/transfer-ownership', requireAuth, loadGroup, requireRole('OWNER'), async (req, res) => {
  const target = await loadTargetMember(req, req.body?.userId);
  if (target.role !== 'ADMIN') {
    return res.status(400).json({ error: 'Ownership can only be transferred to an admin' });
  }
  await prisma.$transaction([
    prisma.groupMember.update({ where: { id: target.id }, data: { role: 'OWNER' } }),
    prisma.groupMember.update({ where: { id: req.membership.id }, data: { role: 'ADMIN' } }),
  ]);
  res.json({ ok: true });
});

router.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return res.status(409).json({ error: 'That already exists' });
  console.error('Groups route error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = router;

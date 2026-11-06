const prisma = require('./prisma');

const MANAGER_ROLES = ['OWNER', 'ADMIN'];

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

function activeMembership(groupId, userId) {
  return prisma.groupMember.findFirst({
    where: { groupId, userId, removedAt: null },
  });
}

async function getGroupAccess(rawGroupId, user) {
  const groupId = parseId(rawGroupId);
  if (!groupId) throw new HttpError(404, 'Group not found');

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new HttpError(404, 'Group not found');

  const membership = user ? await activeMembership(groupId, user.id) : null;
  if (group.isPrivate && !membership && !user?.isAdmin) {
    throw new HttpError(404, 'Group not found');
  }
  return { group, membership };
}

async function loadGroup(req, res, next) {
  const { group, membership } = await getGroupAccess(req.params.id, req.user);
  req.group = group;
  req.membership = membership;
  next();
}

const PERMISSION_ERROR = 'You do not have permission. If you think this is an error, contact your group admin.';

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      return res.status(403).json({ error: PERMISSION_ERROR });
    }
    next();
  };
}

module.exports = {
  MANAGER_ROLES,
  PERMISSION_ERROR,
  HttpError,
  parseId,
  activeMembership,
  getGroupAccess,
  loadGroup,
  requireRole,
};

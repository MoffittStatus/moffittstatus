const { PrismaClient } = require('@prisma/client');

// Shared client so new modules don't each open their own connection pool
const prisma = new PrismaClient();

module.exports = prisma;

/**
 * Achievement Service
 * Handles granting and checking of gamified library rewards.
 * 
 * REQUIRES: DATABASE_URL in .env (for Prisma client)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACHIEVEMENTS = {
  FIRST_SCOUT: {
    name: 'First Scout',
    description: 'Submit your first busyness report',
    icon: 'BookOpen',
    points: 50,
  },
  LIBRARY_REGULAR: {
    name: 'Library Regular',
    description: 'Submit 5 busyness reports',
    icon: 'Award',
    points: 100,
    threshold: 5,
  },
  EARLY_BIRD: {
    name: 'Early Bird',
    description: 'Submit a report before 9 AM',
    icon: 'Sun',
    points: 75,
  },
  NIGHT_OWL: {
    name: 'Night Owl',
    description: 'Submit a report after 10 PM',
    icon: 'Moon',
    points: 75,
  },
};

async function seedAchievements() {
  for (const key in ACHIEVEMENTS) {
    const ach = ACHIEVEMENTS[key];
    await prisma.achievement.upsert({
      where: { name: ach.name },
      update: {},
      create: {
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        points: ach.points,
      },
    });
  }
}

async function checkAndGrant(userId, type, details = {}) {
  if (!userId) return;

  try {
    const userRatingsCount = await prisma.rating.count({ where: { userId } });

    // 1. First Scout
    if (userRatingsCount >= 1) {
      await grantAchievement(userId, ACHIEVEMENTS.FIRST_SCOUT.name);
    }

    // 2. Library Regular
    if (userRatingsCount >= ACHIEVEMENTS.LIBRARY_REGULAR.threshold) {
      await grantAchievement(userId, ACHIEVEMENTS.LIBRARY_REGULAR.name);
    }

    // 3. Early Bird / Night Owl
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9) {
      await grantAchievement(userId, ACHIEVEMENTS.EARLY_BIRD.name);
    } else if (hour >= 22) {
      await grantAchievement(userId, ACHIEVEMENTS.NIGHT_OWL.name);
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

async function grantAchievement(userId, achievementName) {
  const achievement = await prisma.achievement.findUnique({ where: { name: achievementName } });
  if (!achievement) return;

  await prisma.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
    update: {},
    create: {
      userId,
      achievementId: achievement.id,
      status: 'APPROVED',
    },
  });
}

module.exports = {
  seedAchievements,
  checkAndGrant,
};

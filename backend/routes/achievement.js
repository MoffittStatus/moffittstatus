const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { seedAchievements } = require('../utils/achievementService');

// GET /api/achievements
// Returns all global achievement definitions
router.get('/', async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany();
    // Seed if none exist
    if (achievements.length === 0) {
      await seedAchievements();
      return res.json(await prisma.achievement.findMany());
    }
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/user/:userId
// Returns achievements earned by a specific user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: parseInt(userId) },
      include: { achievement: true },
    });
    res.json(userAchievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/achievements/approve
// Admin endpoint to approve a pending achievement
router.post('/approve', async (req, res) => {
  const { userId, achievementId } = req.body;
  try {
    const updated = await prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId: parseInt(userId),
          achievementId: parseInt(achievementId),
        },
      },
      data: { status: 'APPROVED' },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

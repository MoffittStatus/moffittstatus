const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/user/:userId/profile
// Returns the user's aggregated stats (reports count, total points, rank)
router.get('/:userId/profile', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // 1. Get reports count
    const reportsCount = await prisma.rating.count({
      where: { userId }
    });

    // 2. Get user achievements to calculate points
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });
    
    const points = userAchievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);

    // 3. Simple rank logic based on points
    let rank = 'Bronze';
    if (points >= 1000) rank = 'Diamond';
    else if (points >= 500) rank = 'Gold';
    else if (points >= 200) rank = 'Silver';

    res.json({
      reportsCount,
      points,
      rank,
      achievementsCount: userAchievements.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

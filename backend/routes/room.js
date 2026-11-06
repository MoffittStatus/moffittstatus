const express = require('express');
const router = express.Router();
const { getAvailableRooms } = require('../libCal');
// const { SINGLE_SLUGS } = require('../lib/booking-utils');
const SINGLE_SLUGS = [
    "main_stacks",
    "moffitt",
    "kresge",
    "earth_sciences",
    "east_asian",
    "environmental_design",
    "igs",
    "business",
    "social_research",
  ];
// Handles GET /api/rooms
router.get('/', async (req, res) => {
  const date = req.query.date || '';
  const slug = req.query.slug || 'all';

  try {
    if (slug === 'all') {
      const results = await Promise.all(
        SINGLE_SLUGS.map(async (s) => {
          const roomRes = await getAvailableRooms(date, s).catch(() => []);
          return (roomRes || []).map((r) => ({ ...r, librarySlug: s }));
        })
      );
      return res.json(results.flat());
    }

    const roomRes = await getAvailableRooms(date, slug).catch(() => []);
    const data = (roomRes || []).map((r) => ({ ...r, librarySlug: slug }));
    return res.json(data);
  } catch (error) {
    console.error('Express /api/rooms error:', error);
    return res.status(500).json([]);
  }
});

module.exports = router;
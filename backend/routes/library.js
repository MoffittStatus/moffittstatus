const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/library/update
// Expected Body: { library: "Moffitt", rating: 5, isLoud: true, goodForGroups: true, floor: "4th" }
router.post('/update', async (req, res) => {
  const { library, rating, isLoud, goodForGroups, floor, longitude, latitude } = req.body;

  // Basic validation
  if (!library || rating === undefined) {
    return res.status(400).json({ error: 'Library name and rating are required' });
  }

  try {
    const libraryRecord = await prisma.library.findFirst({
      where: {
        name: {
            // "contains" allows fuzzy matching, or use "equals" if your frontend is strict
            contains: library 
        }
      }
    });

    if (!libraryRecord) {
      return res.status(404).json({ error: `Library '${library}' not found in database.` });
    }
    // mapped 'library' from body to 'libraryName' in database
    const newRating = await prisma.rating.create({
      data: {
        libraryName: library,
        rating: parseInt(rating),
        isLoud: Boolean(isLoud),
        goodForGroups: Boolean(goodForGroups),
        floor: String(floor),
        longitude: longitude || -1,
        latitude: latitude || -1,
        // userId is optional but HIGHLY RECOMMENDED for achievement tracking
        userId: req.body.userId ? parseInt(req.body.userId) : null,
      },
    });

    // Check achievements if userId is provided
    // This triggers the gamification logic in utils/achievementService.js
    if (req.body.userId) {
      const { checkAndGrant } = require('../utils/achievementService');
      await checkAndGrant(parseInt(req.body.userId));
    }

    console.log("Did the thing")
    res.json({ message: 'Rating added successfully', data: newRating });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Failed to add rating' });
  }
});

// GET /api/library/:libraryName
// Example: GET /api/library/Moffitt
router.get('/:libraryName', async (req, res) => {
  // 1. Decode the name (e.g., "Moffitt%20Library" -> "Moffitt Library")
  const libraryNameParam = decodeURIComponent(req.params.libraryName);

  const WEIGHT_CONSTANT = 5;
  const FALLBACK_VALUE = 20; // Default if no data exists

  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    // 2. Fetch the Library Data first (for Live/Historical info)
    // We use 'findFirst' with 'contains' to handle slight naming differences
    const libraryData = await prisma.library.findFirst({
      where: {
        name: { contains: libraryNameParam }
      }
    });

    if (!libraryData) {
      return res.status(404).json({ error: 'Library not found' });
    }

    // 3. Fetch specific User Ratings for this library
    const ratings = await prisma.rating.findMany({
      where: {
        libraryName: libraryData.name, // Use the official DB name
        createdAt: { gte: threeHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // --- A. Determine INDEPENDENT_VALUE (The Baseline) ---
    let independentValue = FALLBACK_VALUE;

    // Helper: Get Berkeley Time (reused logic)
    const getBerkeleyTime = () => {
      const now = new Date();
      const options = { timeZone: 'America/Los_Angeles', weekday: 'long', hour: 'numeric', hour12: false };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      let hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
      if (hour === 24) hour = 0;
      return { dayName: parts.find(p => p.type === 'weekday').value, hour };
    };

    const { dayName, hour } = getBerkeleyTime();

    // Logic: Live > Historical > Fallback
    if (libraryData.currentBusyness > 0) {
      independentValue = libraryData.currentBusyness;
    } else if (libraryData.weeklySchedule) {
      const todaySchedule = libraryData.weeklySchedule.find(d => d.name === dayName);
      if (todaySchedule && todaySchedule.data && todaySchedule.data[hour] > 0) {
        independentValue = todaySchedule.data[hour];
      }
    }

    // --- B. Calculate Stats ---
    const sumOfActualRatings = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const countOfActualRatings = ratings.length;

    // --- C. The Algorithm ---
    const weightedAverage = (
      (independentValue * WEIGHT_CONSTANT) + sumOfActualRatings
    ) / (WEIGHT_CONSTANT + countOfActualRatings);

    res.json({
      library: libraryData.name,
      average: weightedAverage.toFixed(1),
      stats: {
        total_reviews: countOfActualRatings,
        baseline_used: independentValue,
        source: libraryData.currentBusyness > 0 ? 'Live Google Data' : 'Historical/Fallback'
      },
      reviews: ratings, // Return the actual text reviews/details
      weeklySchedule: libraryData.weeklySchedule,
    });

  } catch (error) {
    console.error('Error fetching library details:', error);
    res.status(500).json({ error: 'Failed to fetch library details' });
  }
});

router.get('/', async (req, res) => {
  const WEIGHT_CONSTANT = 5;
  const FALLBACK_VALUE = 20; // Only used if the live & historical data are both 0

  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    // Fetch ALL Library Data
    const libraries = await prisma.library.findMany({
      select: {
        name: true,
        currentBusyness: true, // Live Google Data
        weeklySchedule: true,  // Historical Data (JSON)
      }
    });

    // Fetch User Ratings (Grouped by Library)
    const groupedRatings = await prisma.rating.groupBy({
      by: ['libraryName'],
      where: {
        createdAt: { gte: threeHoursAgo },
      },
      _sum: { rating: true },
      _count: { rating: true },
    });

    // Returns { dayName: 'Monday', hour: 14 }
    const getBerkeleyTime = () => {
      const now = new Date();
      const options = { 
        timeZone: 'America/Los_Angeles', 
        weekday: 'long', 
        hour: 'numeric', 
        hour12: false // Returns 0-23
      };
      
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      
      const dayName = parts.find(p => p.type === 'weekday').value;
      const hourStr = parts.find(p => p.type === 'hour').value;
      
      let hour = parseInt(hourStr, 10);
      if (hour === 24) hour = 0;

      return { dayName, hour };
    };

    const { dayName, hour } = getBerkeleyTime();

    // 3. Combine & Calculate
    const results = libraries.map((lib) => {
      
      // Find INDEPENDENT_VALUE (The Baseline)
      let independentValue = FALLBACK_VALUE;

      // Live Google Data, the default
      if (lib.currentBusyness > 0) {
        independentValue = lib.currentBusyness;
      } 
      // Historical Data (if Live is 0)
      else if (lib.weeklySchedule) {
        // Find today's schedule in the JSON
        // Structure: [{ name: 'Monday', data: [0, 0, ... 50, ...] }, ...]
        const todaySchedule = lib.weeklySchedule.find(d => d.name === dayName);
        
        // If we have data for this hour, use it
        if (todaySchedule && todaySchedule.data && todaySchedule.data[hour] > 0) {
          independentValue = todaySchedule.data[hour];
        }
      }

      // Get User Ratings for this Library. Find the group that matches this library name
      const ratingGroup = groupedRatings.find(r => r.libraryName === lib.name);
      const sumOfActualRatings = ratingGroup?._sum.rating || 0;
      const countOfActualRatings = ratingGroup?._count.rating || 0;

      // Bayesian avg
      const weightedAverage = (
        (independentValue * WEIGHT_CONSTANT) + sumOfActualRatings
      ) / (WEIGHT_CONSTANT + countOfActualRatings);
      console.log(lib)
      return {
        library: lib.name,
        average: weightedAverage.toFixed(1), // The final number to show UI
        weeklySchedule: lib.weeklySchedule || [],
        // Debug info only 
        meta: {
          baseline: independentValue,
          source: lib.currentBusyness > 0 ? 'Live' : 'Historical/Fallback',
          user_reviews: countOfActualRatings
        }
      };
    });

    // Sort by busiest first
    //results.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching aggregations:', error);
    res.status(500).json({ error: 'Failed to fetch library stats' });
  }
});
module.exports = router;
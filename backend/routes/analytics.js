
const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rateLimit = require("express-rate-limit");

const analyticsLimiter = rateLimit({
  windowMs: 30 * 1000, 
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
});

    router.post("/track_page_visit", analyticsLimiter, async (req, res) => {
    try {
      const { page } = req.body;
  
      if (!page || typeof page !== "string") {
        return res.status(400).json({ error: "Missing or invalid page" });
      }
  
      const now = new Date();
  
      // Round down to the start of the hour
      const bucketStart = new Date(now);
      bucketStart.setMinutes(0, 0, 0);
  
      const result = await prisma.pageVisit.upsert({
        where: {
          page_bucketStart: {
            page,
            bucketStart,
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          page,
          bucketStart,
          count: 1,
        },
      });
  
      return res.json({ success: true, result });
    } catch (err) {
      console.error("Error tracking page visit:", err);
      return res.status(500).json({
        error: "Analytics tracking unavailable",
        detail: err.message,
      });
    }
  });

  router.get("/page_visits", async (req, res) => {
    try {
      const { page } = req.query;
  
      const visits = await prisma.pageVisit.findMany({
        where: page ? { page: String(page) } : {},
        orderBy: { bucketStart: "desc" },
        take: 200,
      });
  
      return res.json({ visits });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch page visits" });
    }
  });
module.exports = router;

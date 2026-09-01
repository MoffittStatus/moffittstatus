const express = require("express");
const router = express.Router();

const FASTAPI_INTERNAL_URL =
  process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000";

router.post("/recommend", async (req, res) => {
  try {
    const response = await fetch(`${FASTAPI_INTERNAL_URL}/api/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error("FastAPI proxy error:", err);
    return res.status(502).json({
      error: "Recommendation service unavailable",
      detail: err.message,
    });
  }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post("/store_search", async (req, res) => {
    try {
      const { user_lat, user_lng, query, output } = req.body;
  
      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Missing or invalid query",
        });
      }
  
      if (!output || typeof output !== "object") {
        return res.status(400).json({
          error: "Missing or invalid output",
        });
      }
  
      const finalJson = output.final_json || {};
      const debugSteps = output.debug_steps || [];
  
      const savedSearch = await prisma.oskiSearch.create({
        data: {
          userLat: typeof user_lat === "number" ? user_lat : null,
          userLng: typeof user_lng === "number" ? user_lng : null,
          query: query.slice(0, 250),
          name: typeof finalJson.name === "string" ? finalJson.name : null,
          lat: typeof finalJson.lat === "number" ? finalJson.lat : null,
          lng: typeof finalJson.lng === "number" ? finalJson.lng : null,
          pitch: typeof finalJson.pitch === "string" ? finalJson.pitch : null,
          debugSteps: Array.isArray(debugSteps) ? debugSteps : [],
          output,
        },
      });
  
      return res.json({
        success: true,
        search: savedSearch,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(502).json({
        error: "Recommendation service storing is unavailable",
        detail: err.message,
      });
    }
  });
module.exports = router;
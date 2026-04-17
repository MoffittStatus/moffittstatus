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

module.exports = router;
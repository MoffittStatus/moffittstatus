require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');

const cron = require('node-cron');
const { runBatchUpdate } = require('../backend/librarySchedulerUpdate');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3003',               // Local frontend
    'https://www.moffittstatus.asuc.org'   // Deployed frontend
  ],
  credentials: true // allow the session cookie on cross-origin requests
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// DEV ONLY: fake sign-in via /api/dev/login?email=... (see routes/devAuth.js)
if (process.env.DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
  console.warn('DEV_AUTH is on: anyone can sign in as any user via /api/dev/login');
  app.use('/api', require('./routes/devAuth'));
}

// Mount all routes under /api
app.use('/api', apiRoutes);

runBatchUpdate();

// Simple health check
app.get('/', (req, res) => {
  res.send('Library Rating API is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

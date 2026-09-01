require('dotenv').config();
const { createServer } = require('http');
const next = require('next');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { runBatchUpdate } = require('../backend/librarySchedulerUpdate');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("Starting MoffittStatus Server...");

app.prepare().then(() => {
  
  const expressApp = express();

  expressApp.use(cors({
    origin: ['http://localhost:3003', 'https://moffittstatus.asuc.org']
  }));
  expressApp.use(express.json());
  // every 15 minutes
//  cron.schedule('*/15 * * * *', () => {
  //  console.log("Cron Triggered: Updating Library Capacity Status...");
    //runBatchUpdate();
  //});

  //runBatchUpdate();

  // General Backend API routes
  try {
    const apiRoutes = require('../backend/routes');
    expressApp.use('/api', apiRoutes);
  } catch (e) {
    console.log('Backend routes error:', e.message);
    expressApp.use('/api', (req, res) => res.status(404).json({error: 'API not ready'}));
  }

  // Health check
  expressApp.get('/health-test', (req, res) => res.send('MoffittStatus is online!'));

  expressApp.use(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Next.js handling error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const server = createServer(expressApp);

  // Socket setup section
  const socketPath = '/srv/apps/moffitstatus/moffitstatus.sock';

  // Clean up the old socket
  if (fs.existsSync(socketPath)) {
    try {
      fs.unlinkSync(socketPath);
    } catch (e) {
      console.error(`Error deleting old socket: ${e.message}`);
    }
  }

  server.listen(socketPath, () => {
    console.log(`> MoffittStatus listening on: ${socketPath}`);
    
    // permission fix for Nginx
    try {
      fs.chmodSync(socketPath, '0777');
    } catch (e) {
      console.error("WARNING: Could not set socket permissions. Nginx might show 502.");
      console.error(e);
    }
  });

  server.on('error', (err) => {
    console.error('SERVER ERROR:', err);
  });
});

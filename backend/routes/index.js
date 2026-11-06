const express = require('express');
const router = express.Router();
const libraryRoutes = require('./library');
const libcalRoutes = require('./libcal');
const oskichatRoutes = require('./OskiChat');
const analyticsRoutes = require('./analytics');
const roomsRoutes = require('./room');
const groupRoutes = require('./groups');
const eventRoutes = require('./events');


// Mount the library routes
// This means all routes in library.js will be prefixed with /library
router.use('/library', libraryRoutes);
router.use('/libcal', libcalRoutes);
router.use('/oskichat', oskichatRoutes);
router.use('/analytics', analyticsRoutes);


module.exports = router;
const express = require('express');
const router = express.Router();
const libraryRoutes = require('./library');
const libcalRoutes = require('./libcal');
const achievementRoutes = require('./achievement');

// Mount the library routes
router.use('/library', libraryRoutes);
router.use('/libcal', libcalRoutes);
router.use('/achievements', achievementRoutes);

module.exports = router;
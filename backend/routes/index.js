const express = require('express');
const router = express.Router();
const libraryRoutes = require('./library');
const libcalRoutes = require('./libcal');
const achievementRoutes = require('./achievement');
const userRoutes = require('./user');

// Mount the library routes
router.use('/library', libraryRoutes);
router.use('/libcal', libcalRoutes);
router.use('/achievements', achievementRoutes);
router.use('/user', userRoutes);

module.exports = router;
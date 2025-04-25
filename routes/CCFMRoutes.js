const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const ccfmController = require('../controllers/CCFMController');

// Route for CCFM analysis (protected)
router.post('/analyze', authMiddleware, ccfmController.analyzeMetrics);

// Route for fetching historical metrics (protected)
router.get('/history', authMiddleware, ccfmController.getHistory);

module.exports = router;
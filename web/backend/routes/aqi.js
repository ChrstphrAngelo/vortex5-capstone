const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const {
    getAqi,
    getLatestPerDevice,
    getAnalytics
} = require('../controllers/aqiController')

const router = express.Router()

router.use(requireAuth)

// latest reading per device
router.get('/latest', getLatestPerDevice)

// admin-only descriptive analytics (KPIs, buckets, categories, etc.)
router.get('/analytics', requireAdmin, getAnalytics)

// all recent readings
router.get('/', getAqi)

module.exports = router

const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const { getDashboardSummary } = require('../controllers/dashboardController')

const router = express.Router()

router.use(requireAuth)
router.get('/summary', requireAdmin, getDashboardSummary)

module.exports = router

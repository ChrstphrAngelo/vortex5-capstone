const express = require('express')
const { requireAuth } = require('../middleware/requireAuth')
const { getCurrentAlerts, getAlertHistory } = require('../controllers/alertsController')

const router = express.Router()

router.use(requireAuth)
router.get('/current', getCurrentAlerts)
router.get('/history', getAlertHistory)

module.exports = router

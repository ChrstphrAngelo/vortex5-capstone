const express = require('express')
const { requireAuth } = require('../middleware/requireAuth')
const {
    getAqi,
    getLatestPerDevice
} = require('../controllers/aqiController')

const router = express.Router()

router.use(requireAuth)

// latest reading per device
router.get('/latest', getLatestPerDevice)

// all recent readings
router.get('/', getAqi)

module.exports = router

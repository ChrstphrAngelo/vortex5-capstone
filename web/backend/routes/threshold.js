const express = require('express')
const {
  getThresholds,
  createThreshold,
  deleteThreshold,
  addAdvisory,
  updateThreshold,
  updateAdvisory,
  deleteAdvisory
} = require('../controllers/thresholdController')

const router = express.Router()

router.get('/', getThresholds)
router.post('/', createThreshold)
router.delete('/:id', deleteThreshold)
router.put('/:id', updateThreshold)

/* ADVISORY ROUTES */
router.post('/:id/advisory', addAdvisory)
router.put('/:id/advisory/:index', updateAdvisory)
router.delete('/:id/advisory/:index', deleteAdvisory)

module.exports = router

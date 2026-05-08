const express = require('express')
const {
  inputAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement
} = require('../controllers/announcementController')

const router = express.Router()

// Get all announcements
router.get('/', getAnnouncements)

// POST an announcement
router.post('/', inputAnnouncement)
router.delete('/:id', deleteAnnouncement)
router.put('/:id', updateAnnouncement)

module.exports = router
const express = require('express')
const router = express.Router()

const {
  getMedia,
  createMedia,
  deleteMedia
} = require('../controllers/mediaController')

const upload = require('../middleware/upload')

// GET
router.get('/', getMedia)

// POST (with file upload)
router.post('/', upload.single('video'), createMedia)

// DELETE
router.delete('/:id', deleteMedia)

module.exports = router
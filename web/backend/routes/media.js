const express = require('express')
const router = express.Router()

const {
  getMedia,
  createMedia,
  deleteMedia
} = require('../controllers/mediaController')

const upload = require('../middleware/upload')

// Wrap multer to convert its errors into clean JSON responses
const uploadVideo = (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('[upload] multer error:', err.message)
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}

router.get('/', getMedia)
router.post('/', uploadVideo, createMedia)
router.delete('/:id', deleteMedia)

module.exports = router
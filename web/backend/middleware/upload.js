const multer = require('multer')
const fs = require('fs')
const path = require('path')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

// Ensure the uploads directory exists before multer tries to write to it.
// On Render (and any fresh container), this folder doesn't exist on boot —
// multer.diskStorage does NOT auto-create it like the default `dest:` option.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  console.log('[upload] created uploads directory at', UPLOAD_DIR)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // Sanitize the original name to be filesystem-safe (no spaces, no weird chars)
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, Date.now() + '-' + safe)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,   // 100 MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only video files are allowed'), false)
    }
  }
})

module.exports = upload

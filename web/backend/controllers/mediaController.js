const Media = require('../models/MediaModel')
const fs = require('fs')
const path = require('path')
const logAudit = require('../utils/logAudit')

/* GET ALL MEDIA */
const getMedia = async (req, res) => {
  const media = await Media.find().sort({ createdAt: -1 })
  res.status(200).json(media)
}

/* CREATE MEDIA */
const createMedia = async (req, res) => {
  try {
    console.log('FILE:', req.file)
    console.log('BODY:', req.body)

    const { title } = req.body
    const actor = req.user?.email || 'Unknown'

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' })
    }

    const videoUrl = `/uploads/${req.file.filename}`

    const media = await Media.create({ title, videoUrl })

    // Add audit log for upload
    await logAudit({
      module: 'Bulletin Board',
      action: `Video "${title || 'Untitled'}" was uploaded`,
      user: actor
    })

    res.status(200).json(media)
  } catch (error) {
    console.log('UPLOAD ERROR:', error)
    res.status(500).json({ error: error.message })
  }
}

/* DELETE MEDIA */
const deleteMedia = async (req, res) => {
  const { id } = req.params
  const actor = req.user?.email || 'Unknown'

  try {
    // Get the media before deleting to know the filename
    const media = await Media.findById(id)

    if (!media) {
      return res.status(404).json({ error: 'Media not found' })
    }

    // Delete the actual file from uploads folder
    if (media.videoUrl) {
      const filePath = path.join(__dirname, '..', media.videoUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await Media.findByIdAndDelete(id)

    // Add audit log for delete
    await logAudit({
      module: 'Bulletin Board',
      action: `Video "${media.title || 'Untitled'}" was deleted`,
      user: actor
    })

    res.status(200).json(media)
  } catch (error) {
    console.log('DELETE ERROR:', error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getMedia,
  createMedia,
  deleteMedia
}
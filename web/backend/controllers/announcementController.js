const Announcement = require('../models/AnnouncementModel')

// get all
const getAnnouncements = async (req, res) => {
  const announcements = await Announcement.find({}).sort({ createdAt: -1 })
  res.status(200).json(announcements)
}

// create
const inputAnnouncement = async (req, res) => {
  const { title, description, date, time } = req.body

  try {
    const announcement = await Announcement.create({
      title,
      description,
      date,
      time
    })

    res.status(200).json(announcement)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// delete
const deleteAnnouncement = async (req, res) => {
  const { id } = req.params

  const announcement = await Announcement.findByIdAndDelete(id)

  if (!announcement) {
    return res.status(404).json({ error: 'No such announcement' })
  }

  res.status(200).json(announcement)
}

// update
const updateAnnouncement = async (req, res) => {
  const { id } = req.params

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  )

  if (!announcement) {
    return res.status(404).json({ error: 'No such announcement' })
  }

  res.status(200).json(announcement)
}

module.exports = {
  inputAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement
}
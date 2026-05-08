const mongoose = require('mongoose')

const Schema = mongoose.Schema

const AnnouncementSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String
  }
}, { timestamps: true })

module.exports = mongoose.model('Announcement', AnnouncementSchema)
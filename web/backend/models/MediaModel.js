const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Media', mediaSchema)
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const DeviceSchema = new Schema({
    deviceId: { type: String, required: true, unique: true, index: true },
    name:     { type: String, required: true },
    room:     { type: String, required: true },
    status:   { type: String, default: 'offline', enum: ['online', 'offline'] },
    lastSeen: { type: Date, default: null }
}, { timestamps: true })

module.exports = mongoose.model('Device', DeviceSchema)

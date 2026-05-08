const Device = require('../models/DeviceModel')
const User = require('../models/userModel')
const mqttSubscriber = require('../services/mqttSubscriber')

// GET /api/device — returns only devices the logged-in user has access to
const getMyDevices = async (req, res) => {
  try {
    const userDeviceIds = req.user.devices || []
    if (userDeviceIds.length === 0) return res.status(200).json([])
    const devices = await Device.find({ deviceId: { $in: userDeviceIds } }).sort({ createdAt: -1 })
    res.status(200).json(devices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/device — admin-only: register/provision a new device and add to admin's list
const registerDevice = async (req, res) => {
  const { deviceId, name, room } = req.body
  if (!deviceId || !name || !room) {
    return res.status(400).json({ error: 'deviceId, name, and room are required' })
  }

  try {
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { deviceId, name, room },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { devices: deviceId } }
    )
    res.status(200).json(device)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// POST /api/device/:deviceId/share — admin-only: grant a user access by email
const shareDevice = async (req, res) => {
  const { deviceId } = req.params
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required' })

  try {
    const device = await Device.findOne({ deviceId })
    if (!device) return res.status(404).json({ error: 'Device not found' })

    // Case-insensitive exact match — handles users who signed up with mixed case
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const target = await User.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } })
    if (!target) return res.status(404).json({ error: 'No user found with that email' })

    if ((target.devices || []).includes(deviceId)) {
      return res.status(200).json({ ok: true, message: 'User already has access' })
    }

    await User.updateOne(
      { _id: target._id },
      { $addToSet: { devices: deviceId } }
    )
    res.status(200).json({
      ok: true,
      message: `${deviceId} shared with ${target.firstName} ${target.lastName}`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/device/:deviceId/unshare — admin-only: revoke a user's access
const unshareDevice = async (req, res) => {
  const { deviceId } = req.params
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required' })

  try {
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const target = await User.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } })
    if (!target) return res.status(404).json({ error: 'No user found with that email' })

    await User.updateOne(
      { _id: target._id },
      { $pull: { devices: deviceId } }
    )
    res.status(200).json({ ok: true, message: `Access revoked for ${target.email}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// GET /api/device/:deviceId/users — admin-only: list users who have access to a device
const getDeviceUsers = async (req, res) => {
  const { deviceId } = req.params
  try {
    const users = await User.find({ devices: deviceId }).select('email firstName lastName role')
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// DELETE /api/device/:deviceId — admin-only: delete device from the entire system
const deleteDevice = async (req, res) => {
  const { deviceId } = req.params
  try {
    const device = await Device.findOneAndDelete({ deviceId })
    if (!device) return res.status(404).json({ error: 'device not found' })
    await User.updateMany({}, { $pull: { devices: deviceId } })
    res.status(200).json(device)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/device/:deviceId/reset — admin-only: send MQTT reset command
const resetDevice = async (req, res) => {
  const { deviceId } = req.params
  try {
    const device = await Device.findOne({ deviceId })
    if (!device) return res.status(404).json({ error: 'device not found' })
    await mqttSubscriber.publishCommand(deviceId, 'reset')
    res.status(200).json({ ok: true, message: `reset command sent to ${deviceId}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getMyDevices,
  registerDevice,
  shareDevice,
  unshareDevice,
  getDeviceUsers,
  deleteDevice,
  resetDevice
}

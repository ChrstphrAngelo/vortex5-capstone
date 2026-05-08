const AqiModel = require('../models/AqiModel')

// all readings for user's devices, newest first
const getAqi = async (req, res) => {
  const userDeviceIds = req.user.devices || []
  if (userDeviceIds.length === 0) return res.status(200).json([])
  const aqis = await AqiModel.find({ deviceId: { $in: userDeviceIds } })
    .sort({ createdAt: -1 })
    .limit(500)
  res.status(200).json(aqis)
}

// latest reading per device (only user's devices)
const getLatestPerDevice = async (req, res) => {
  try {
    const userDeviceIds = req.user.devices || []
    if (userDeviceIds.length === 0) return res.status(200).json([])
    const latest = await AqiModel.aggregate([
      { $match: { deviceId: { $in: userDeviceIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$deviceId',
          doc: { $first: '$$ROOT' }
      }},
      { $replaceRoot: { newRoot: '$doc' } }
    ])
    res.status(200).json(latest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getAqi, getLatestPerDevice }

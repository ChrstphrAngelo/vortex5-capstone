const AqiModel = require('../models/AqiModel')
const ThresholdModel = require('../models/ThresholdModel')
const Device = require('../models/DeviceModel')
const getVisibleDeviceIds = require('../utils/visibleDevices')

// GET /api/alerts/current — alerts for *latest* reading of each user device.
const getCurrentAlerts = async (req, res) => {
  try {
    const userDeviceIds = await getVisibleDeviceIds(req.user)
    if (userDeviceIds.length === 0) return res.status(200).json([])

    const thresholdDoc = await ThresholdModel.findOne().sort({ createdAt: -1 }).lean()
    const limits = buildLimits(thresholdDoc)

    const latestReadings = await AqiModel.aggregate([
      { $match: { deviceId: { $in: userDeviceIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$deviceId', latest: { $first: '$$ROOT' } } }
    ])

    const devices = await Device.find({ deviceId: { $in: userDeviceIds } }).lean()
    const deviceMap = Object.fromEntries(devices.map(d => [d.deviceId, d]))

    const alerts = []
    for (const r of latestReadings) {
      const reading = r.latest
      const device = deviceMap[reading.deviceId]
      if (!device) continue

      for (const f of FIELDS) {
        if (reading[f] != null && reading[f] > limits[f]) {
          alerts.push({
            deviceId: reading.deviceId,
            name: device.name,
            room: device.room,
            field: f,
            value: reading[f],
            limit: limits[f],
            severity: reading[f] > limits[f] * 1.5 ? 'high' : 'warning',
            at: reading.createdAt,
          })
        }
      }
    }
    res.status(200).json(alerts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// GET /api/alerts/history?days=7 — threshold-crossing events in the past N days.
// Uses a MongoDB aggregation pipeline so no raw readings are loaded into Node.js memory.
const getAlertHistory = async (req, res) => {
  try {
    const userDeviceIds = await getVisibleDeviceIds(req.user)
    if (userDeviceIds.length === 0) return res.status(200).json([])

    const days = Math.min(parseInt(req.query.days || '7', 10), 30)
    const since = new Date(Date.now() - days * 86400 * 1000)

    const thresholdDoc = await ThresholdModel.findOne().sort({ createdAt: -1 }).lean()
    const limits = buildLimits(thresholdDoc)

    const events = await AqiModel.aggregate([
      // 1. Narrow to user's devices within the requested time window
      { $match: { deviceId: { $in: userDeviceIds }, createdAt: { $gte: since } } },

      // 2. Sort ascending per device — required for $shift to look at the previous row
      { $sort: { deviceId: 1, createdAt: 1 } },

      // 3. Add a "previous" value for each monitored field using a lag window function
      { $setWindowFields: {
        partitionBy: '$deviceId',
        sortBy: { createdAt: 1 },
        output: {
          prevAqi:          { $shift: { output: '$Aqi',          by: -1, default: null } },
          prevPM25:         { $shift: { output: '$PM25',         by: -1, default: null } },
          prevPM10:         { $shift: { output: '$PM10',         by: -1, default: null } },
          prevCO2:          { $shift: { output: '$CO2',          by: -1, default: null } },
          prevTVOC:         { $shift: { output: '$TVOC',         by: -1, default: null } },
          prevFormaldehyde: { $shift: { output: '$Formaldehyde', by: -1, default: null } },
        }
      }},

      // 4. Build a "crossings" array: only fields that went from below → above threshold
      { $addFields: {
        crossings: {
          $filter: {
            input: [
              { field: 'Aqi',          value: '$Aqi',          prev: '$prevAqi',          thresh: limits.Aqi },
              { field: 'PM25',         value: '$PM25',         prev: '$prevPM25',         thresh: limits.PM25 },
              { field: 'PM10',         value: '$PM10',         prev: '$prevPM10',         thresh: limits.PM10 },
              { field: 'CO2',          value: '$CO2',          prev: '$prevCO2',          thresh: limits.CO2 },
              { field: 'TVOC',         value: '$TVOC',         prev: '$prevTVOC',         thresh: limits.TVOC },
              { field: 'Formaldehyde', value: '$Formaldehyde', prev: '$prevFormaldehyde', thresh: limits.Formaldehyde },
            ],
            cond: { $and: [
              // field has a value
              { $gt: [{ $ifNull: ['$$this.value', null] }, null] },
              // current reading exceeds threshold
              { $gt: ['$$this.value', '$$this.thresh'] },
              // previous reading did NOT exceed (null treated as 0 = below threshold)
              { $not: { $gt: [{ $ifNull: ['$$this.prev', 0] }, '$$this.thresh'] } }
            ]}
          }
        }
      }},

      // 5. Discard readings with no crossings
      { $match: { 'crossings.0': { $exists: true } } },

      // 6. Expand — one document per crossing event
      { $unwind: '$crossings' },

      // 7. Shape to final output
      { $project: {
        _id: 0,
        deviceId: 1,
        field: '$crossings.field',
        value: '$crossings.value',
        limit: '$crossings.thresh',
        severity: { $cond: [
          { $gt: ['$crossings.value', { $multiply: ['$crossings.thresh', 1.5] }] },
          'high', 'warning'
        ]},
        at: '$createdAt'
      }},

      // 8. Most recent first, cap at 100
      { $sort: { at: -1 } },
      { $limit: 100 }
    ])

    // Enrich with device name and room (tiny lookup — only device documents, not readings)
    const devices = await Device.find({ deviceId: { $in: userDeviceIds } }).lean()
    const deviceMap = Object.fromEntries(devices.map(d => [d.deviceId, d]))

    const result = events
      .map(e => {
        const device = deviceMap[e.deviceId]
        if (!device) return null
        return { ...e, name: device.name, room: device.room }
      })
      .filter(Boolean)

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const FIELDS = ['Aqi', 'PM25', 'PM10', 'CO2', 'TVOC', 'Formaldehyde']

function buildLimits(thresholdDoc) {
  return {
    Aqi:          thresholdDoc?.Aqi          ?? 100,
    PM25:         thresholdDoc?.PM25         ?? 40,
    PM10:         thresholdDoc?.PM10         ?? 100,
    CO2:          thresholdDoc?.CO2          ?? 1000,
    TVOC:         thresholdDoc?.TVOC         ?? 500,
    Formaldehyde: thresholdDoc?.Formaldehyde ?? 100,
  }
}

module.exports = { getCurrentAlerts, getAlertHistory }

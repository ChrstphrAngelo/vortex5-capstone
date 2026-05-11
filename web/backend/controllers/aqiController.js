const AqiModel = require('../models/AqiModel')
const Device = require('../models/DeviceModel')

// EPA AQI category from numeric value
function aqiCategory(aqi) {
  if (aqi <= 50)  return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy (SG)'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

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

// Descriptive analytics: KPIs, time-buckets, distribution, per-device, hour×weekday heatmap.
// Admin-only. Returns all aggregations the front-end needs in a single payload.
const getAnalytics = async (req, res) => {
  try {
    const userDeviceIds = req.user.devices || []
    if (userDeviceIds.length === 0) {
      return res.status(200).json({
        kpis: { avg: 0, max: 0, min: 0, count: 0, pctGood: 0 },
        buckets: [],
        categories: [],
        byDevice: [],
        heatmap: [],
        recent: []
      })
    }

    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 3600 * 1000)
    const to   = req.query.to   ? new Date(req.query.to)   : new Date()

    // Build device filter — either ALL user devices, or a specific one if requested.
    // If the requested device isn't in the user's list, return empty.
    if (req.query.deviceId && !userDeviceIds.includes(req.query.deviceId)) {
      return res.status(200).json({
        kpis: { avg: 0, max: 0, min: 0, count: 0, pctGood: 0 },
        buckets: [], categories: [], byDevice: [], heatmap: [], recent: []
      })
    }
    const deviceFilter = req.query.deviceId
      ? { deviceId: req.query.deviceId }
      : { deviceId: { $in: userDeviceIds } }

    const match = { ...deviceFilter, createdAt: { $gte: from, $lte: to } }

    // Bucket size: pick something that gives ~60-100 points over the requested range.
    const rangeMs = to - from
    const bucketMinutes = rangeMs <= 6 * 3600 * 1000 ? 5         // <=6h:  5min
                       : rangeMs <= 24 * 3600 * 1000 ? 15        // <=24h: 15min
                       : rangeMs <= 7 * 86400 * 1000 ? 60        // <=7d:  1h
                       : 360                                      // else:  6h
    const bucketMs = bucketMinutes * 60 * 1000

    // Heatmap range: always last 7 days for a useful hour×weekday view, scoped to same devices.
    const heatmapFrom = new Date(Date.now() - 7 * 86400 * 1000)
    const heatmapMatch = { ...deviceFilter, createdAt: { $gte: heatmapFrom } }

    // Run all aggregations in parallel.
    const [kpisAgg, bucketsAgg, byDeviceAgg, heatmapAgg, recent] = await Promise.all([
      // KPI summary
      AqiModel.aggregate([
        { $match: match },
        { $group: {
            _id: null,
            avg: { $avg: '$Aqi' },
            max: { $max: '$Aqi' },
            min: { $min: '$Aqi' },
            count: { $sum: 1 },
            goodCount: { $sum: { $cond: [{ $lte: ['$Aqi', 50] }, 1, 0] } }
        }}
      ]),

      // Time buckets for line chart
      AqiModel.aggregate([
        { $match: match },
        { $group: {
            _id: { $toDate: {
              $subtract: [
                { $toLong: '$createdAt' },
                { $mod: [{ $toLong: '$createdAt' }, bucketMs] }
              ]
            }},
            avgAqi:  { $avg: '$Aqi' },
            avgPM25: { $avg: '$PM25' },
            avgPM10: { $avg: '$PM10' },
            avgCO2:  { $avg: '$CO2' },
            avgTVOC: { $avg: '$TVOC' },
            avgTemp: { $avg: '$Temperature' },
            avgHum:  { $avg: '$Humidity' }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Per-device averages for bar chart
      AqiModel.aggregate([
        { $match: match },
        { $group: {
            _id: '$deviceId',
            avgAqi: { $avg: '$Aqi' },
            maxAqi: { $max: '$Aqi' },
            count: { $sum: 1 }
        }},
        { $sort: { avgAqi: -1 } }
      ]),

      // Hour × weekday heatmap (always last 7 days)
      AqiModel.aggregate([
        { $match: heatmapMatch },
        { $group: {
            _id: {
              dow:  { $dayOfWeek: '$createdAt' },   // 1=Sun, 7=Sat
              hour: { $hour: '$createdAt' }
            },
            avgAqi: { $avg: '$Aqi' },
            count: { $sum: 1 }
        }}
      ]),

      // Recent readings for the data grid
      AqiModel.find(match).sort({ createdAt: -1 }).limit(100).lean()
    ])

    // Build category breakdown from buckets isn't accurate — query separately.
    const categoryAgg = await AqiModel.aggregate([
      { $match: match },
      { $bucket: {
          groupBy: '$Aqi',
          boundaries: [0, 51, 101, 151, 201, 301, Infinity],
          default: 'Hazardous',
          output: { count: { $sum: 1 } }
      }}
    ])

    const categoryLabels = ['Good', 'Moderate', 'Unhealthy (SG)', 'Unhealthy', 'Very Unhealthy', 'Hazardous']
    const categories = categoryLabels.map((label, i) => {
      // $bucket uses lower bound as _id; map by index.
      const bucket = categoryAgg.find(b => {
        const lowerBounds = [0, 51, 101, 151, 201, 301]
        return b._id === lowerBounds[i] || (i === 5 && b._id === 'Hazardous')
      })
      return { label, count: bucket?.count || 0 }
    })

    // Enrich byDevice with name/room
    const devices = await Device.find({ deviceId: { $in: userDeviceIds } }).lean()
    const deviceMap = Object.fromEntries(devices.map(d => [d.deviceId, d]))
    const byDevice = byDeviceAgg.map(d => ({
      deviceId: d._id,
      name: deviceMap[d._id]?.name || d._id,
      room: deviceMap[d._id]?.room || '',
      avgAqi: Math.round(d.avgAqi),
      maxAqi: d.maxAqi,
      count: d.count
    }))

    // Format heatmap as flat array of {dow, hour, avgAqi}
    const heatmap = heatmapAgg.map(h => ({
      dow: h._id.dow,     // 1-7 (Sun-Sat)
      hour: h._id.hour,   // 0-23
      avgAqi: Math.round(h.avgAqi)
    }))

    // Format KPIs
    const k = kpisAgg[0] || { avg: 0, max: 0, min: 0, count: 0, goodCount: 0 }
    const kpis = {
      avg: Math.round(k.avg || 0),
      max: k.max || 0,
      min: k.min || 0,
      count: k.count,
      pctGood: k.count > 0 ? Math.round((k.goodCount / k.count) * 100) : 0,
      avgCategory: aqiCategory(Math.round(k.avg || 0))
    }

    res.status(200).json({
      kpis,
      buckets: bucketsAgg.map(b => ({
        time: b._id,
        aqi: Math.round(b.avgAqi),
        pm25: Math.round(b.avgPM25 * 10) / 10,
        pm10: Math.round(b.avgPM10 * 10) / 10,
        co2: Math.round(b.avgCO2),
        tvoc: Math.round(b.avgTVOC),
        temp: Math.round(b.avgTemp * 10) / 10,
        humidity: Math.round(b.avgHum * 10) / 10
      })),
      categories,
      byDevice,
      heatmap,
      recent: recent.map(r => ({
        ...r,
        category: aqiCategory(r.Aqi)
      }))
    })
  } catch (error) {
    console.error('[analytics] error:', error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getAqi, getLatestPerDevice, getAnalytics }

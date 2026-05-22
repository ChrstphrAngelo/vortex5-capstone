const AqiModel = require('../models/AqiModel')
const Device = require('../models/DeviceModel')
const ThresholdModel = require('../models/ThresholdModel')

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

// Per-pollutant fields we compute statistics for.
const POLLUTANT_FIELDS = ['Aqi', 'PM1', 'PM25', 'PM10', 'TVOC', 'CO2', 'Formaldehyde', 'Temperature', 'Humidity']

// Default WHO/EPA-style guideline limits (overridden by the latest Threshold doc).
const DEFAULT_LIMITS = {
  Aqi: 100, PM25: 25, PM10: 50, CO2: 1000, TVOC: 500, Formaldehyde: 100,
}

// Build a $group spec that computes avg/min/max/std for every pollutant field.
function buildStatsGroup() {
  const spec = { _id: null, count: { $sum: 1 } }
  for (const f of POLLUTANT_FIELDS) {
    spec[`${f}_avg`] = { $avg: `$${f}` }
    spec[`${f}_min`] = { $min: `$${f}` }
    spec[`${f}_max`] = { $max: `$${f}` }
    spec[`${f}_std`] = { $stdDevPop: `$${f}` }
  }
  return spec
}

// Convert a raw stats agg result into { field: {avg,min,max,std} }.
function shapeStats(row) {
  const out = {}
  for (const f of POLLUTANT_FIELDS) {
    out[f] = {
      avg: round(row?.[`${f}_avg`]),
      min: round(row?.[`${f}_min`]),
      max: round(row?.[`${f}_max`]),
      std: round(row?.[`${f}_std`]),
    }
  }
  return out
}

const round = (v, d = 1) => v == null ? null : Math.round(v * 10 ** d) / 10 ** d

// Descriptive analytics — single bundled payload for the front-end.
// Admin-only. Features: aggregation/stats, trend, pattern heatmap, exceedance
// reporting, comparative analysis, AQI distribution.
const getAnalytics = async (req, res) => {
  const empty = {
    kpis: { avg: 0, max: 0, min: 0, count: 0, pctGood: 0, avgCategory: 'Good' },
    buckets: [], categories: [], byDevice: [], heatmap: [], recent: [],
    pollutantStats: {}, exceedances: [], comparison: null,
  }
  try {
    const userDeviceIds = req.user.devices || []
    if (userDeviceIds.length === 0) return res.status(200).json(empty)

    if (req.query.deviceId && !userDeviceIds.includes(req.query.deviceId)) {
      return res.status(200).json(empty)
    }

    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 3600 * 1000)
    const to   = req.query.to   ? new Date(req.query.to)   : new Date()
    const rangeMs = to - from

    const deviceFilter = req.query.deviceId
      ? { deviceId: req.query.deviceId }
      : { deviceId: { $in: userDeviceIds } }
    const match = { ...deviceFilter, createdAt: { $gte: from, $lte: to } }

    // ----- Trend bucket size -----
    // Honour an explicit granularity, else auto-pick for ~60-100 points.
    const granularity = req.query.granularity // 'hour' | 'day' | 'week' | 'month' | undefined
    const bucketMs = granularity === 'hour'  ? 3600 * 1000
                  : granularity === 'day'   ? 86400 * 1000
                  : granularity === 'week'  ? 7 * 86400 * 1000
                  : granularity === 'month' ? 30 * 86400 * 1000
                  : rangeMs <= 6 * 3600 * 1000  ? 5 * 60 * 1000
                  : rangeMs <= 24 * 3600 * 1000 ? 15 * 60 * 1000
                  : rangeMs <= 7 * 86400 * 1000 ? 3600 * 1000
                  : 6 * 3600 * 1000

    // Heatmap always uses last 7 days for a meaningful hour×weekday picture.
    const heatmapFrom = new Date(Date.now() - 7 * 86400 * 1000)
    const heatmapMatch = { ...deviceFilter, createdAt: { $gte: heatmapFrom } }

    // Previous equal-length window (for comparative analysis).
    const prevFrom = new Date(from.getTime() - rangeMs)
    const prevMatch = { ...deviceFilter, createdAt: { $gte: prevFrom, $lt: from } }

    // Thresholds (latest doc or defaults)
    const thresholdDoc = await ThresholdModel.findOne().sort({ createdAt: -1 }).lean()
    const limits = {
      Aqi:          thresholdDoc?.Aqi          ?? DEFAULT_LIMITS.Aqi,
      PM25:         thresholdDoc?.PM25         ?? DEFAULT_LIMITS.PM25,
      PM10:         thresholdDoc?.PM10         ?? DEFAULT_LIMITS.PM10,
      CO2:          thresholdDoc?.CO2          ?? DEFAULT_LIMITS.CO2,
      TVOC:         thresholdDoc?.TVOC         ?? DEFAULT_LIMITS.TVOC,
      Formaldehyde: thresholdDoc?.Formaldehyde ?? DEFAULT_LIMITS.Formaldehyde,
    }

    const [
      statsAgg, prevStatsAgg, weekdayStatsAgg, weekendStatsAgg,
      bucketsAgg, byDeviceAgg, heatmapAgg, hourlyAgg, categoryAgg, recent,
    ] = await Promise.all([
      // 1. Per-pollutant stats for the current range
      AqiModel.aggregate([{ $match: match }, { $group: buildStatsGroup() }]),

      // 5a. Same stats for previous equal window
      AqiModel.aggregate([{ $match: prevMatch }, { $group: buildStatsGroup() }]),

      // 5b. Weekday-only stats (Mon–Fri => dayOfWeek 2..6)
      AqiModel.aggregate([
        { $match: match },
        { $addFields: { dow: { $dayOfWeek: '$createdAt' } } },
        { $match: { dow: { $gte: 2, $lte: 6 } } },
        { $group: buildStatsGroup() },
      ]),

      // 5c. Weekend-only stats (Sun=1, Sat=7)
      AqiModel.aggregate([
        { $match: match },
        { $addFields: { dow: { $dayOfWeek: '$createdAt' } } },
        { $match: { $or: [{ dow: 1 }, { dow: 7 }] } },
        { $group: buildStatsGroup() },
      ]),

      // 2. Trend buckets
      AqiModel.aggregate([
        { $match: match },
        { $group: {
            _id: { $toDate: { $subtract: [
              { $toLong: '$createdAt' },
              { $mod: [{ $toLong: '$createdAt' }, bucketMs] }
            ] }},
            avgAqi:  { $avg: '$Aqi' },
            avgPM25: { $avg: '$PM25' },
            avgPM10: { $avg: '$PM10' },
            avgCO2:  { $avg: '$CO2' },
            avgTVOC: { $avg: '$TVOC' },
            avgHCHO: { $avg: '$Formaldehyde' },
            avgTemp: { $avg: '$Temperature' },
            avgHum:  { $avg: '$Humidity' }
        }},
        { $sort: { _id: 1 } }
      ]),

      // Per-device averages
      AqiModel.aggregate([
        { $match: match },
        { $group: { _id: '$deviceId', avgAqi: { $avg: '$Aqi' }, maxAqi: { $max: '$Aqi' }, count: { $sum: 1 } } },
        { $sort: { avgAqi: -1 } }
      ]),

      // 3. Heatmap (hour × weekday)
      AqiModel.aggregate([
        { $match: heatmapMatch },
        { $group: {
            _id: { dow: { $dayOfWeek: '$createdAt' }, hour: { $hour: '$createdAt' } },
            avgAqi: { $avg: '$Aqi' }, count: { $sum: 1 }
        }}
      ]),

      // 4. Hourly buckets for exceedance reporting (count hours each pollutant crossed its limit)
      AqiModel.aggregate([
        { $match: match },
        { $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: 'hour' } },
            Aqi:          { $avg: '$Aqi' },
            PM25:         { $avg: '$PM25' },
            PM10:         { $avg: '$PM10' },
            CO2:          { $avg: '$CO2' },
            TVOC:         { $avg: '$TVOC' },
            Formaldehyde: { $avg: '$Formaldehyde' },
        }}
      ]),

      // 6. AQI category distribution
      AqiModel.aggregate([
        { $match: match },
        { $bucket: {
            groupBy: '$Aqi',
            boundaries: [0, 51, 101, 151, 201, 301, Infinity],
            default: 'Hazardous',
            output: { count: { $sum: 1 } }
        }}
      ]),

      // Recent readings
      AqiModel.find(match).sort({ createdAt: -1 }).limit(100).lean(),
    ])

    // ----- KPIs (derived from current stats) -----
    const statsRow = statsAgg[0] || {}
    const totalCount = statsRow.count || 0
    // % good needs a separate quick count
    const goodAgg = await AqiModel.aggregate([
      { $match: match },
      { $group: { _id: null, good: { $sum: { $cond: [{ $lte: ['$Aqi', 50] }, 1, 0] } } } }
    ])
    const goodCount = goodAgg[0]?.good || 0
    const avgAqi = Math.round(statsRow.Aqi_avg || 0)
    const kpis = {
      avg: avgAqi,
      max: statsRow.Aqi_max || 0,
      min: statsRow.Aqi_min || 0,
      count: totalCount,
      pctGood: totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0,
      avgCategory: aqiCategory(avgAqi),
    }

    // ----- Category distribution -----
    const categoryLabels = ['Good', 'Moderate', 'Unhealthy (SG)', 'Unhealthy', 'Very Unhealthy', 'Hazardous']
    const lowerBounds = [0, 51, 101, 151, 201, 301]
    const categories = categoryLabels.map((label, i) => {
      const bucket = categoryAgg.find(b => b._id === lowerBounds[i] || (i === 5 && b._id === 'Hazardous'))
      const count = bucket?.count || 0
      return { label, count, pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 }
    })

    // ----- Per-device -----
    const devices = await Device.find({ deviceId: { $in: userDeviceIds } }).lean()
    const deviceMap = Object.fromEntries(devices.map(d => [d.deviceId, d]))
    const byDevice = byDeviceAgg.map(d => ({
      deviceId: d._id,
      name: deviceMap[d._id]?.name || d._id,
      room: deviceMap[d._id]?.room || '',
      avgAqi: Math.round(d.avgAqi),
      maxAqi: d.maxAqi,
      count: d.count,
    }))

    // ----- Heatmap -----
    const heatmap = heatmapAgg.map(h => ({
      dow: h._id.dow, hour: h._id.hour, avgAqi: Math.round(h.avgAqi),
    }))

    // ----- Exceedances (feature 4) -----
    // Each hourly bucket = ~1 hour. Count buckets where the hour's average exceeded the limit.
    const totalHours = hourlyAgg.length
    const exceedanceFields = ['Aqi', 'PM25', 'PM10', 'CO2', 'TVOC', 'Formaldehyde']
    const exceedances = exceedanceFields.map(f => {
      const hours = hourlyAgg.filter(h => h[f] != null && h[f] > limits[f]).length
      return {
        field: f,
        limit: limits[f],
        hours,
        totalHours,
        pctTime: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      }
    })

    // ----- Comparative analysis (feature 5) -----
    const comparison = {
      current:  { avgAqi: round(statsRow.Aqi_avg, 0), maxAqi: statsRow.Aqi_max || 0, count: totalCount },
      previous: {
        avgAqi: round(prevStatsAgg[0]?.Aqi_avg, 0),
        maxAqi: prevStatsAgg[0]?.Aqi_max || 0,
        count: prevStatsAgg[0]?.count || 0,
      },
      weekday: { avgAqi: round(weekdayStatsAgg[0]?.Aqi_avg, 0), count: weekdayStatsAgg[0]?.count || 0 },
      weekend: { avgAqi: round(weekendStatsAgg[0]?.Aqi_avg, 0), count: weekendStatsAgg[0]?.count || 0 },
    }

    res.status(200).json({
      kpis,
      pollutantStats: shapeStats(statsRow),       // feature 1
      buckets: bucketsAgg.map(b => ({             // feature 2
        time: b._id,
        aqi: Math.round(b.avgAqi),
        pm25: round(b.avgPM25),
        pm10: round(b.avgPM10),
        co2: Math.round(b.avgCO2),
        tvoc: Math.round(b.avgTVOC),
        hcho: Math.round(b.avgHCHO),
        temp: round(b.avgTemp),
        humidity: round(b.avgHum),
      })),
      heatmap,                                     // feature 3
      exceedances,                                 // feature 4
      comparison,                                  // feature 5
      categories,                                  // feature 6
      byDevice,
      recent: recent.map(r => ({ ...r, category: aqiCategory(r.Aqi) })),
    })
  } catch (error) {
    console.error('[analytics] error:', error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getAqi, getLatestPerDevice, getAnalytics }

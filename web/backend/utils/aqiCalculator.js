// EPA AQI calculation from PM2.5 / PM10 concentrations (24-hour breakpoints).
// Returns the higher of the two sub-indexes — standard EPA convention.

const PM25_BREAKS = [
  [0.0,    12.0,    0,   50],
  [12.1,   35.4,   51,  100],
  [35.5,   55.4,  101,  150],
  [55.5,  150.4,  151,  200],
  [150.5, 250.4,  201,  300],
  [250.5, 500.4,  301,  500]
]

const PM10_BREAKS = [
  [0,    54,    0,   50],
  [55,   154,   51,  100],
  [155,  254,  101,  150],
  [255,  354,  151,  200],
  [355,  424,  201,  300],
  [425,  604,  301,  500]
]

function aqiFromConcentration(c, breaks) {
  if (c < 0) return 0
  for (const [bpL, bpH, iL, iH] of breaks) {
    if (c >= bpL && c <= bpH) {
      return Math.round(((iH - iL) / (bpH - bpL)) * (c - bpL) + iL)
    }
  }
  return 500 // off the chart
}

function computeAqi({ PM25, PM10 }) {
  return Math.max(
    aqiFromConcentration(PM25, PM25_BREAKS),
    aqiFromConcentration(PM10, PM10_BREAKS)
  )
}

module.exports = { computeAqi, aqiFromConcentration }

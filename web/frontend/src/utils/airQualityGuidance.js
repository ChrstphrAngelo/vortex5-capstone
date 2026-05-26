// Air-quality guidance based on credible public-health sources:
//  - U.S. EPA AirNow — AQI categories & recommended actions
//  - WHO Global Air Quality Guidelines (2021) — PM2.5 / PM10
//  - U.S. EPA Indoor Air Quality + ASHRAE — CO2, TVOC, formaldehyde, temp, humidity
// These power the on-screen "Recommended Actions" so advice traces to a standard.

export const CATEGORY_COLORS = {
  'Good': '#16a34a',
  'Moderate': '#f59e0b',
  'Unhealthy (SG)': '#ea580c',
  'Unhealthy': '#dc2626',
  'Very Unhealthy': '#9333ea',
  'Hazardous': '#7f1d1d',
}

export function aqiCategory(aqi) {
  if (aqi == null) return null
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy (SG)'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

// Overall AQI recommended actions (EPA AirNow).
const AQI_ACTIONS = {
  'Good': [
    'Air quality is healthy — normal activities are fine.',
    'Keep windows open for fresh-air ventilation.',
  ],
  'Moderate': [
    'Air quality is acceptable.',
    'Unusually sensitive people should watch for symptoms during long or heavy activity.',
  ],
  'Unhealthy (SG)': [
    'Sensitive groups (children, elderly, asthma/heart conditions) should limit prolonged or heavy exertion.',
    'Move strenuous activities indoors and improve ventilation.',
  ],
  'Unhealthy': [
    'Everyone should limit prolonged outdoor exertion.',
    'Close windows and run a HEPA / MERV-13+ air purifier.',
    'Sensitive groups should stay indoors.',
  ],
  'Very Unhealthy': [
    'Everyone should avoid outdoor exertion and stay indoors.',
    'Seal the room and run an air purifier; wear an N95 respirator if you must go out.',
    'Avoid adding indoor pollution — no frying, vacuuming, or candles.',
  ],
  'Hazardous': [
    'Health emergency — everyone stay indoors with windows shut and air filtered.',
    'Wear an N95 respirator outdoors; relocate to a clean-air shelter if the room cannot stay clean.',
    'Seek medical help for any breathing difficulty.',
  ],
}

export function aqiAdvisory(aqi) {
  const category = aqiCategory(aqi)
  if (!category) return null
  return {
    category,
    color: CATEGORY_COLORS[category],
    actions: AQI_ACTIONS[category] || [],
  }
}

// Per-component qualitative reading + concrete action.
// Returns { label, unit, level, color, advice, ok } or null when value is null.
export function componentInsight(key, v) {
  if (v == null) return null
  const G = CATEGORY_COLORS['Good']
  const M = CATEGORY_COLORS['Moderate']
  const U = CATEGORY_COLORS['Unhealthy (SG)']
  const R = CATEGORY_COLORS['Unhealthy']
  const P = CATEGORY_COLORS['Very Unhealthy']
  const mk = (label, unit, level, color, advice, ok = false) => ({ label, unit, level, color, advice, ok })

  switch (key) {
    case 'pm25':
      if (v <= 12) return mk('PM2.5', 'µg/m³', 'Good', G, 'Fine-particle levels are healthy.', true)
      if (v <= 35.4) return mk('PM2.5', 'µg/m³', 'Moderate', M, 'Acceptable. Sensitive people should watch for symptoms during long exposure.')
      if (v <= 55.4) return mk('PM2.5', 'µg/m³', 'Unhealthy (SG)', U, 'Sensitive groups should improve ventilation or run a HEPA air purifier; remove indoor sources (smoke, cooking).')
      if (v <= 150.4) return mk('PM2.5', 'µg/m³', 'Unhealthy', R, 'Close windows, run a HEPA/MERV-13+ purifier, and stop indoor combustion. Sensitive groups stay indoors.')
      return mk('PM2.5', 'µg/m³', 'Very Unhealthy', P, 'Heavy fine-particle pollution. Seal the room, filter the air, and wear an N95 if going out.')
    case 'pm10':
      if (v <= 54) return mk('PM10', 'µg/m³', 'Good', G, 'Coarse-particle (dust) levels are healthy.', true)
      if (v <= 154) return mk('PM10', 'µg/m³', 'Moderate', M, 'Acceptable dust. Damp-dust instead of dry sweeping; sensitive people limit long exposure.')
      if (v <= 254) return mk('PM10', 'µg/m³', 'Unhealthy (SG)', U, 'Elevated dust. Improve ventilation, run an air purifier, and avoid dry sweeping/vacuuming.')
      if (v <= 354) return mk('PM10', 'µg/m³', 'Unhealthy', R, 'High dust. Close windows, filter the air, and remove dust sources.')
      return mk('PM10', 'µg/m³', 'Very Unhealthy', P, 'Very high dust. Limit exposure and filter the air now.')
    case 'co2':
      if (v <= 800) return mk('CO₂', 'ppm', 'Good', G, 'Well-ventilated space.', true)
      if (v <= 1000) return mk('CO₂', 'ppm', 'Moderate', M, 'Acceptable. Bring in fresh air if people feel drowsy (ASHRAE target ≈ 1000 ppm).')
      if (v <= 1500) return mk('CO₂', 'ppm', 'Stuffy', U, 'Air is stuffy — increase ventilation: open windows/doors or boost mechanical airflow.')
      if (v <= 2000) return mk('CO₂', 'ppm', 'Poor', R, 'Poor ventilation. Open windows/doors and reduce room occupancy to bring CO₂ down.')
      return mk('CO₂', 'ppm', 'Very Poor', P, 'High CO₂ causes headaches and poor concentration. Ventilate the room immediately.')
    case 'tvoc':
      if (v <= 300) return mk('TVOC', 'µg/m³', 'Good', G, 'Low levels of volatile organic compounds.', true)
      if (v <= 500) return mk('TVOC', 'µg/m³', 'Moderate', M, 'Acceptable. Ventilate if you notice odors.')
      if (v <= 1000) return mk('TVOC', 'µg/m³', 'Elevated', U, 'Increase fresh air and check sources (cleaners, paint, new furniture, air fresheners).')
      if (v <= 3000) return mk('TVOC', 'µg/m³', 'High', R, 'Ventilate well and remove the source; symptoms (irritation, headache) possible.')
      return mk('TVOC', 'µg/m³', 'Very High', P, 'Ventilate the room now and identify/remove the emitting source.')
    case 'hcho': // formaldehyde — EPA indoor limit ≈ 0.1 ppm (100 ppb)
      if (v <= 100) return mk('Formaldehyde', 'ppb', 'Good', G, 'Below the EPA indoor guideline (0.1 ppm).', true)
      if (v <= 300) return mk('Formaldehyde', 'ppb', 'Elevated', U, 'Ventilate — especially with new pressed-wood furniture; use low-emitting materials.')
      return mk('Formaldehyde', 'ppb', 'High', R, 'Ventilate aggressively, run AC/dehumidifier, and remove or seal the source.')
    case 'temp':
      if (v >= 20 && v <= 24.5) return mk('Temperature', '°C', 'Comfortable', G, 'Within the ASHRAE comfort range (20–24.5 °C).', true)
      if ((v >= 17 && v < 20) || (v > 24.5 && v <= 28)) return mk('Temperature', '°C', 'Fair', M, 'Slightly outside the comfort range — adjust heating/cooling or use fans.')
      if (v < 17) return mk('Temperature', '°C', 'Cold', R, 'Too cold for comfort. Add heating.')
      return mk('Temperature', '°C', 'Hot', R, 'Too warm for comfort. Improve cooling or ventilation.')
    case 'humidity':
      if (v >= 30 && v <= 50) return mk('Humidity', '%', 'Comfortable', G, 'Within the EPA healthy range (30–50%).', true)
      if ((v > 50 && v <= 60) || (v >= 25 && v < 30)) return mk('Humidity', '%', 'Fair', M, 'Slightly outside the ideal 30–50% range — monitor.')
      if (v > 60) return mk('Humidity', '%', 'Too Humid', R, 'High humidity encourages mold and dust mites. Dehumidify, fix leaks, and ventilate.')
      return mk('Humidity', '%', 'Too Dry', R, 'Very dry air irritates eyes, skin, and airways. Use a humidifier.')
    default:
      return null
  }
}

// Build a list of component insights that need attention (not OK), from a reading.
export function flaggedComponents(reading) {
  if (!reading) return []
  const map = [
    ['pm25', reading.PM25],
    ['pm10', reading.PM10],
    ['co2', reading.CO2],
    ['tvoc', reading.TVOC],
    ['hcho', reading.Formaldehyde],
    ['temp', reading.Temperature],
    ['humidity', reading.Humidity],
  ]
  return map
    .map(([k, v]) => componentInsight(k, v))
    .filter((c) => c && !c.ok)
}

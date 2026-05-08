const Threshold = require('../models/ThresholdModel')
const logAudit = require('../utils/logAudit');

/* ---------------- GET ---------------- */

const getThresholds = async (req, res) => {
  const thresholds = await Threshold.find().sort({ createdAt: -1 })
  res.status(200).json(thresholds)
}

/* ---------------- CREATE ---------------- */

  const createThreshold = async (req, res) => {
    const { label, Aqi, PM1, PM25, PM10, TVOC, CO2, Formaldehyde, Temperature, Humidity } = req.body

    try {
      const threshold = await Threshold.create({
        label,
        Aqi,
        PM1,
        PM25,
        PM10,
        TVOC,
        CO2,
        Formaldehyde,
        Temperature,
        Humidity
      })

      logAudit({
        module: 'Configuration',
        action: `Created threshold "${label}"`,
        user: req.body.user || 'Admin'
      })

      res.status(200).json(threshold)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  }

/* ---------------- DELETE THRESHOLD ---------------- */

const deleteThreshold = async (req, res) => {
  const { id } = req.params

  try {
    const threshold = await Threshold.findByIdAndDelete(id)
    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' })
    }

    logAudit({
    module: 'Configuration',
    action: `Deleted threshold "${threshold.label}`,
    user: (req.body && req.body.user) ? req.body.user : 'Admin'
  });

    res.status(200).json(threshold)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ---------------- ADD ADVISORY ---------------- */

const addAdvisory = async (req, res) => {
  const { id } = req.params
  const { advisory } = req.body

  if (!advisory) {
    return res.status(400).json({ error: 'Advisory text is required' })
  }

  try {
    const threshold = await Threshold.findById(id)
    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' })
    }

    threshold.advisories.push(advisory)
    await threshold.save()

    // Audit log
    logAudit({
    module: 'Advisory',
    action: `Added advisory "${advisory}" to threshold "${threshold.label}"`,
    user: req.body.user || 'Admin'
  });

    res.status(200).json(threshold)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ---------------- UPDATE ADVISORY ---------------- */

const updateAdvisory = async (req, res) => {
  const { id, index } = req.params
  const { advisory } = req.body

  try {
    const threshold = await Threshold.findById(id)
    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' })
    }

    if (!threshold.advisories[index]) {
      return res.status(404).json({ error: 'Advisory not found' })
    }

    threshold.advisories[index] = advisory
    await threshold.save()

    logAudit({
    module: 'Advisory',
    action: `Updated advisory at index ${index} for threshold "${threshold.label}"`,
    user: req.body.user || 'Admin'
  });

    res.status(200).json(threshold)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ---------------- DELETE ADVISORY ---------------- */

const deleteAdvisory = async (req, res) => {
  const { id, index } = req.params

  try {
    const threshold = await Threshold.findById(id)
    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' })
    }

    threshold.advisories.splice(index, 1)
    await threshold.save()

    logAudit({
    module: 'Advisory',
    action: `Deleted advisory at index ${index} from threshold "${threshold.label}"`,
    user: (req.body && req.body.user) ? req.body.user : 'Admin'
  });
    
    res.status(200).json(threshold)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ---------------- UPDATE THRESHOLD ---------------- */

const updateThreshold = async (req, res) => {
  const { id } = req.params
  const { label, Aqi, PM1, PM25, PM10, TVOC, CO2, Formaldehyde, Temperature, Humidity } = req.body

  try {
    const threshold = await Threshold.findByIdAndUpdate(
      id,
      { label, Aqi, PM1, PM25, PM10, TVOC, CO2, Formaldehyde, Temperature, Humidity },
      { new: true }
    )

    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' })
    }

    logAudit({
      module: 'Configuration',
      action: `Updated threshold "${threshold.label}"`,
      user: req.body.user || 'Admin'
    })

    res.status(200).json(threshold)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getThresholds,
  createThreshold,
  deleteThreshold,
  updateThreshold,
  addAdvisory,
  updateAdvisory,
  deleteAdvisory
}

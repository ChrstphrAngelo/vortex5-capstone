const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ThresholdSchema = new Schema(
  {
    label:        { type: String, required: true },
    Aqi:          { type: Number, default: null },
    PM1:          { type: Number, default: null },
    PM25:         { type: Number, default: null },
    PM10:         { type: Number, default: null },
    TVOC:         { type: Number, default: null },
    CO2:          { type: Number, default: null },
    Formaldehyde: { type: Number, default: null },
    Temperature:  { type: Number, default: null },
    Humidity:     { type: Number, default: null },
    advisories:   { type: [String], default: [] }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Threshold', ThresholdSchema)

const mongoose = require('mongoose')

const Schema = mongoose.Schema

const AqiSchema = new Schema({
    deviceId:     { type: String, required: true, index: true },
    Aqi:          { type: Number, required: true }, // computed from PM2.5/PM10
    PM1:          { type: Number, required: true },
    PM25:         { type: Number, required: true },
    PM10:         { type: Number, required: true },
    TVOC:         { type: Number, required: true }, // µg/m³
    CO2:          { type: Number, required: true }, // ppm
    Formaldehyde: { type: Number, required: true }, // µg/m³
    Temperature:  { type: Number, required: true }, // °C
    Humidity:     { type: Number, required: true }  // %RH
}, { timestamps: true })

module.exports = mongoose.model('AQI', AqiSchema)

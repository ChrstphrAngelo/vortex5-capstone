const mqtt = require('mqtt')
const AqiModel = require('../models/AqiModel')
const Device = require('../models/DeviceModel')
const { decodeFrame } = require('../utils/sensorDecoder')
const { computeAqi } = require('../utils/aqiCalculator')

const HIVEMQ_URL = 'mqtts://1c097cff873e428286ffc57255b3a044.s1.eu.hivemq.cloud:8883'
const TOPIC      = 'bewair/+/telemetry'

let _client = null

function start() {
  if (!process.env.MQTT_USERNAME || !process.env.MQTT_PASSWORD) {
    console.error('[mqtt] MQTT_USERNAME / MQTT_PASSWORD missing in .env — subscriber disabled')
    return
  }

  _client = mqtt.connect(HIVEMQ_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: 'bewair-backend-' + Math.random().toString(16).slice(2, 8),
    reconnectPeriod: 5000,
    keepalive: 60
  })

  _client.on('connect', () => {
    console.log('[mqtt] connected to HiveMQ')
    _client.subscribe(TOPIC, (err) => {
      if (err) console.error('[mqtt] subscribe failed:', err.message)
      else     console.log('[mqtt] subscribed to', TOPIC)
    })
  })

  _client.on('error',     (err) => console.error('[mqtt] error:', err.message))
  _client.on('reconnect', ()    => console.log('[mqtt] reconnecting...'))
  _client.on('close',     ()    => console.log('[mqtt] connection closed'))

  _client.on('message', async (topic, payload) => {
    const parts = topic.split('/')
    if (parts.length !== 3 || parts[0] !== 'bewair' || parts[2] !== 'telemetry') return
    const deviceId = parts[1]

    let metrics
    try {
      metrics = decodeFrame(payload.toString('utf8'))
    } catch (err) {
      console.warn(`[mqtt] decode failed for ${deviceId}: ${err.message}`)
      return
    }

    const Aqi = computeAqi(metrics)

    try {
      await AqiModel.create({ deviceId, Aqi, ...metrics })
      await Device.updateOne(
        { deviceId },
        { $set: { status: 'online', lastSeen: new Date() } }
        // do NOT upsert — only update devices the user has registered
      )
    } catch (err) {
      console.error(`[mqtt] db write failed for ${deviceId}: ${err.message}`)
    }
  })

  return _client
}

function publishCommand(deviceId, command) {
  return new Promise((resolve, reject) => {
    if (!_client || !_client.connected) {
      return reject(new Error('MQTT client not connected'))
    }
    _client.publish(
      `bewair/${deviceId}/cmd`,
      command,
      { qos: 1, retain: false },
      (err) => (err ? reject(err) : resolve())
    )
  })
}

module.exports = { start, publishCommand }

const Device = require('../models/DeviceModel')

// Returns the list of deviceIds a user is allowed to see.
// Admins see every device in the system; other roles only see the
// devices that have been shared with their account (user.devices).
async function getVisibleDeviceIds(user) {
  if (user?.role === 'admin') {
    const all = await Device.find({}, 'deviceId').lean()
    return all.map(d => d.deviceId)
  }
  return user?.devices || []
}

module.exports = getVisibleDeviceIds

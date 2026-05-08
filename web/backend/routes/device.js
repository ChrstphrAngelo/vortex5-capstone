const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const {
  getMyDevices,
  registerDevice,
  shareDevice,
  unshareDevice,
  getDeviceUsers,
  deleteDevice,
  resetDevice
} = require('../controllers/deviceController')

const router = express.Router()

router.use(requireAuth)

router.get('/',                        getMyDevices)
router.post('/',           requireAdmin, registerDevice)
router.post('/:deviceId/share',   requireAdmin, shareDevice)
router.post('/:deviceId/unshare', requireAdmin, unshareDevice)
router.get('/:deviceId/users',    requireAdmin, getDeviceUsers)
router.post('/:deviceId/reset',   requireAdmin, resetDevice)
router.delete('/:deviceId',       requireAdmin, deleteDevice)

module.exports = router

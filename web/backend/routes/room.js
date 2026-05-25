const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController')

const router = express.Router()

router.use(requireAuth)

router.get('/',            getRooms)                 // any authenticated user
router.post('/',           requireAdmin, createRoom)
router.put('/:id',         requireAdmin, updateRoom)
router.delete('/:id',      requireAdmin, deleteRoom)

module.exports = router

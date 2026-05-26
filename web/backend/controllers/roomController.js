const Room = require('../models/RoomModel')
const Device = require('../models/DeviceModel')
const logAudit = require('../utils/logAudit')

// GET /api/room — list all rooms (any authenticated user; mobile uses this for the dropdown)
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ name: 1 })
    res.status(200).json(rooms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/room — create a room (admin only)
const createRoom = async (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Room name is required' })
  }
  try {
    const room = await Room.create({ name: name.trim() })
    logAudit({
      module: 'Classroom',
      action: `Room "${room.name}" was created by ${req.user.email}`,
      user: req.user.email,
    })
    res.status(201).json(room)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A room with that name already exists' })
    }
    res.status(400).json({ error: error.message })
  }
}

// PUT /api/room/:id — rename a room (admin only)
const updateRoom = async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Room name is required' })
  }
  try {
    // Capture the old name first so we can cascade the rename to devices,
    // which reference their room by name (not by id).
    const existing = await Room.findById(id)
    if (!existing) return res.status(404).json({ error: 'Room not found' })
    const oldName = existing.name
    const newName = name.trim()

    const room = await Room.findByIdAndUpdate(id, { name: newName }, { new: true })

    // Keep devices in sync: any device still pointing at the old room name
    // gets moved to the new name so it doesn't appear as a separate room.
    if (oldName !== newName) {
      await Device.updateMany({ room: oldName }, { room: newName })
    }

    logAudit({
      module: 'Classroom',
      action: `Room renamed from "${oldName}" to "${room.name}" by ${req.user.email}`,
      user: req.user.email,
    })
    res.status(200).json(room)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A room with that name already exists' })
    }
    res.status(400).json({ error: error.message })
  }
}

// DELETE /api/room/:id — remove a room (admin only)
const deleteRoom = async (req, res) => {
  const { id } = req.params
  try {
    const room = await Room.findByIdAndDelete(id)
    if (!room) return res.status(404).json({ error: 'Room not found' })
    logAudit({
      module: 'Classroom',
      action: `Room "${room.name}" was deleted by ${req.user.email}`,
      user: req.user.email,
    })
    res.status(200).json(room)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getRooms, createRoom, updateRoom, deleteRoom }

const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')
const {
    signupUser,
    loginUser,
    getUsers,
    createUserByAdmin,
    deactivateUser,
    reactivateUser,
    updateUserRole
} = require('../controllers/userController')

const router = express.Router()

// Public auth routes
router.post('/login', loginUser)
router.post('/signup', signupUser)

// Admin-only user management
router.get('/',                    requireAuth, requireAdmin, getUsers)
router.post('/',                   requireAuth, requireAdmin, createUserByAdmin)
router.patch('/:id/deactivate',    requireAuth, requireAdmin, deactivateUser)
router.patch('/:id/reactivate',    requireAuth, requireAdmin, reactivateUser)
router.patch('/:id',               requireAuth, requireAdmin, updateUserRole)

module.exports = router

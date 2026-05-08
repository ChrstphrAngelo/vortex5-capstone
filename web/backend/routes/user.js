const express = require('express')
const {
    signupUser,
    loginUser,
    getUsers,
    deactivateUser,
    reactivateUser,
    updateUserRole
} = require('../controllers/userController')

const router = express.Router()

// auth
router.post('/login', loginUser)
router.post('/signup', signupUser)

// user management
router.get('/', getUsers)
router.patch('/:id/deactivate', deactivateUser)
router.patch('/:id/reactivate', reactivateUser)
router.patch('/:id', updateUserRole)

module.exports = router
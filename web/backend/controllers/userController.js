const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const validator = require('validator')
const logAudit = require('../utils/logAudit');

const createToken = (_id) => {
   return jwt.sign({_id}, process.env.SECRET, {expiresIn: '3d'})
}

const loginUser = async (req, res) => {
    const {email, password} = req.body
    
    try {
        const user = await User.login(email, password)
        const token = createToken(user._id)

        res.status(200).json({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            token
        })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const signupUser = async (req, res) => {
    const {email, password, firstName, lastName} = req.body

    try {
        // First account in the system becomes admin automatically.
        // Everyone else signs up as staff. Public signup cannot self-elevate to admin.
        const userCount = await User.countDocuments()
        const role = userCount === 0 ? 'admin' : 'staff'

        const user = await User.signup(email, password, firstName, lastName, role)
        const token = createToken(user._id)

        logAudit({
            module: 'User',
            action: `New user registered: ${firstName} ${lastName} (${email}) as ${role}`,
            user: email
        })

        res.status(200).json({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            token
        })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// Admin-only: create a new user with a chosen role.
// Different from signup — this doesn't log the new user in, doesn't return a token.
const createUserByAdmin = async (req, res) => {
    const {email, password, firstName, lastName, role} = req.body

    if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({error: 'Invalid role. Must be admin or staff.'})
    }

    try {
        const user = await User.signup(email, password, firstName, lastName, role)

        logAudit({
            module: 'User',
            action: `New ${role} created: ${firstName} ${lastName} (${email}) by ${req.user.email}`,
            user: req.user.email
        })

        res.status(200).json({
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt
        })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const getUsers = async (req, res) => {
    const { status } = req.query
    
    let query = {}
    if (status && ['active', 'deactivated'].includes(status)) {
        query.status = status
    }
    
    const users = await User.find(query).select('-password')
    res.status(200).json(users)
}

const deactivateUser = async (req, res) => {
    const { id } = req.params
    const { performedBy } = req.body

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { 
                status: 'deactivated',
                deactivatedAt: new Date()
            },
            { new: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        await logAudit({
            module: 'User',
            action: `User ${user.firstName} ${user.lastName} (${user.email}) was deactivated by ${performedBy || 'Unknown'}`,
            user: performedBy || 'Unknown'
        })

        res.status(200).json({ 
            message: 'User deactivated successfully',
            user 
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const reactivateUser = async (req, res) => {
    const { id } = req.params
    const { performedBy } = req.body

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { 
                status: 'active',
                deactivatedAt: null
            },
            { new: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        await logAudit({
            module: 'User',
            action: `User ${user.firstName} ${user.lastName} (${user.email}) was reactivated by ${performedBy || 'Unknown'}`,
            user: performedBy || 'Unknown'
        })

        res.status(200).json({ 
            message: 'User reactivated successfully',
            user 
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

const updateUserRole = async (req, res) => {
    const { id } = req.params
    const { role, performedBy } = req.body

    if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
    }

    try {
        const oldUser = await User.findById(id)
        
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        await logAudit({
            module: 'User',
            action: `User ${user.firstName} ${user.lastName} (${user.email}) role changed from ${oldUser.role} to ${role} by ${performedBy || 'Unknown'}`,
            user: performedBy || 'Unknown'
        })

        res.status(200).json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// GET /api/user/me — current logged-in user's profile
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// PATCH /api/user/me — update current user's firstName, lastName, email
const updateMyProfile = async (req, res) => {
    const { firstName, lastName, email } = req.body

    if (firstName !== undefined && !firstName.trim()) {
        return res.status(400).json({ error: 'First name cannot be empty' })
    }
    if (lastName !== undefined && !lastName.trim()) {
        return res.status(400).json({ error: 'Last name cannot be empty' })
    }
    if (email !== undefined && !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' })
    }

    try {
        // If changing email, check it's not already taken by another user
        if (email !== undefined) {
            const existing = await User.findOne({ email })
            if (existing && existing._id.toString() !== req.user._id.toString()) {
                return res.status(400).json({ error: 'Email already in use' })
            }
        }

        const updates = {}
        if (firstName !== undefined) updates.firstName = firstName.trim()
        if (lastName  !== undefined) updates.lastName  = lastName.trim()
        if (email     !== undefined) updates.email     = email.trim()

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })

        logAudit({
            module: 'User',
            action: `${user.email} updated their profile`,
            user: user.email,
        })

        res.status(200).json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// POST /api/user/me/password — change current user's password
const changeMyPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' })
    }
    if (!validator.isStrongPassword(newPassword)) {
        return res.status(400).json({ error: 'New password is not strong enough (need 8+ chars, mixed case, number, symbol)' })
    }

    try {
        const user = await User.findById(req.user._id)
        if (!user) return res.status(404).json({ error: 'User not found' })

        const match = await bcrypt.compare(currentPassword, user.password)
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' })

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(newPassword, salt)
        user.password = hash
        await user.save()

        logAudit({
            module: 'User',
            action: `${user.email} changed their password`,
            user: user.email,
        })

        res.status(200).json({ ok: true, message: 'Password updated successfully' })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

module.exports = {
    signupUser,
    loginUser,
    getUsers,
    createUserByAdmin,
    deactivateUser,
    reactivateUser,
    updateUserRole,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
}
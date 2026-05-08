const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err))

const userSchema = new mongoose.Schema({}, { strict: false })
const User = mongoose.model('User', userSchema, 'users')

const migrate = async () => {
    try {
        const result = await User.updateMany(
            { devices: { $exists: false } },
            { $set: { devices: [] } }
        )
        console.log(`Added devices field to ${result.modifiedCount} users`)
        process.exit(0)
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrate()

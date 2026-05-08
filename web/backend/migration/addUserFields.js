const mongoose = require('mongoose')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err))

const userSchema = new mongoose.Schema({}, { strict: false })
const User = mongoose.model('User', userSchema, 'users')

const migrate = async () => {
    try {
        // Add status field to users without it
        const statusResult = await User.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active' } }
        )
        console.log(`✅ Added status field to ${statusResult.modifiedCount} users`)

        // Add createdAt field to users without it (using _id timestamp)
        const usersWithoutDate = await User.find({ createdAt: { $exists: false } })
        
        for (const user of usersWithoutDate) {
            const createdAt = user._id.getTimestamp()
            await User.updateOne(
                { _id: user._id },
                { $set: { createdAt: createdAt, updatedAt: createdAt } }
            )
        }
        console.log(`✅ Added createdAt field to ${usersWithoutDate.length} users`)

        console.log('🎉 Migration completed successfully!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    }
}

migrate()
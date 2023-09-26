const mongoose = require('mongoose')
require('dotenv').config()

const uri = process.env.DATABASE_URL

async function connectDB() {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        console.log('Successfully connected to MongoDB')
    } catch(err) {
        console.log("Failure: Unconnected to MongoDB", err)
        //console.error('Could not connect to MongoDB', err)
        throw new Error();
    }
}

module.exports = connectDB
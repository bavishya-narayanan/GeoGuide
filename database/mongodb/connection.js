const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geoguide_places';
        await mongoose.connect(uri);
        console.log('MongoDB Connected to geoguide_places');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const closeDB = async () => {
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed');
};

module.exports = { connectDB, closeDB };

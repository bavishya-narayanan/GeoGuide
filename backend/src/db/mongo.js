const env = require('../config/env');
const Place = require('../../../database/mongodb/placeModel');
const mongoose = Place.base;

async function connectMongo() {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
}

async function healthCheck() {
    await mongoose.connection.db.command({ ping: 1 });
}

async function closeMongo() {
    await mongoose.disconnect();
}

module.exports = { mongoose, connectMongo, healthCheck, closeMongo };
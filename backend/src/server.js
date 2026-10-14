const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { healthCheck: spatialHealth, spatialPool } = require('./db/spatial');
const { healthCheck: usersHealth, usersPool } = require('./db/users');
const { connectMongo, healthCheck: mongoHealth, closeMongo } = require('./db/mongo');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiters');

const app = express();
app.use(helmet());
app.use(cors({ origin: env.frontendOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/health', (request, response) => response.json({ success: true, service: 'geoguide-backend' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use(errorHandler);

async function start() {
    console.log('GeoGuide Backend Starting...');
    if (!env.auth.jwtSecret) {
        throw new Error('JWT_SECRET is not set. Add it to the root .env file.');
    }
    if (!env.spatial.password) {
        throw new Error('SPATIAL_DB_PASSWORD is not set. Add it to the root .env file or set PGPASSWORD.');
    }
    if (!env.users.password) {
        throw new Error('USER_DB_PASSWORD is not set. Add it to the root .env file or set PGPASSWORD.');
    }
    try {
        await spatialHealth();
        console.log('Spatial PostgreSQL: Connected');
    } catch (error) {
        console.error('Spatial PostgreSQL: Failed', error.message);
        throw error;
    }
    try {
        await connectMongo();
        await mongoHealth();
        console.log('MongoDB: Connected');
    } catch (error) {
        console.error('MongoDB: Failed', error.message);
        throw error;
    }
    try {
        await usersHealth();
        console.log('User PostgreSQL: Connected');
    } catch (error) {
        console.error('User PostgreSQL: Failed', error.message);
        throw error;
    }

    const server = await new Promise((resolve, reject) => {
        const instance = app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
            resolve(instance);
        });
        instance.once('error', reject);
    });
    return server;
}

if (require.main === module) {
    start().catch(async (error) => {
        const message = error.code === 'EADDRINUSE'
            ? `Port ${env.port} is already in use. Stop the existing backend or set a different PORT in .env.`
            : error.message;
        console.error(`Backend startup failed: ${message}`);
        await closeMongo().catch(() => {});
        await spatialPool.end().catch(() => {});
        await usersPool.end().catch(() => {});
        process.exitCode = 1;
    });
}

module.exports = { app, start };
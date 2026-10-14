const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const postgresPassword = (specificVariable) =>
    process.env[specificVariable] ?? process.env.PGPASSWORD ?? '';

const env = {
    port: Number(process.env.PORT || 5000),
    spatial: {
        host: process.env.SPATIAL_DB_HOST || 'localhost',
        port: Number(process.env.SPATIAL_DB_PORT || 5432),
        database: process.env.SPATIAL_DB_NAME || 'geoguide_spatial',
        user: process.env.SPATIAL_DB_USER || 'postgres',
        password: postgresPassword('SPATIAL_DB_PASSWORD')
    },
    users: {
        host: process.env.USER_DB_HOST || 'localhost',
        port: Number(process.env.USER_DB_PORT || 5432),
        database: process.env.USER_DB_NAME || 'geoguide_users',
        user: process.env.USER_DB_USER || 'postgres',
        password: postgresPassword('USER_DB_PASSWORD')
    },
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geoguide_places',
    frontendOrigins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
    auth: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
};

module.exports = env;
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.USER_DB_HOST || 'localhost',
    port: Number(process.env.USER_DB_PORT || 5432),
    database: process.env.USER_DB_NAME || 'geoguide_users',
    user: process.env.USER_DB_USER || 'postgres',
    password: process.env.USER_DB_PASSWORD,
});

module.exports = pool;
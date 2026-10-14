const { Pool } = require('pg');
const env = require('../config/env');

const spatialPool = new Pool(env.spatial);

async function healthCheck() {
    await spatialPool.query('SELECT 1');
}

module.exports = { spatialPool, healthCheck };
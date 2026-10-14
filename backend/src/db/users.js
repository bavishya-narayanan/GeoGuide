const { Pool } = require('pg');
const env = require('../config/env');

const usersPool = new Pool(env.users);

async function healthCheck() {
    await usersPool.query('SELECT 1');
}

module.exports = { usersPool, healthCheck };
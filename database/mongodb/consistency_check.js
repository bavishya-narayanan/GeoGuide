const { Client } = require('pg');
const { connectDB, closeDB } = require('./connection');
const Place = require('./placeModel');
const fs = require('fs');

const runConsistencyCheck = async () => {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Connecting to PostgreSQL...');
    const pgClient = new Client({
        user: process.env.PGUSER || 'postgres',
        host: process.env.PGHOST || 'localhost',
        database: process.env.PGDATABASE || 'geoguide_spatial',
        password: process.env.PGPASSWORD || 'bavsh@123',
        port: process.env.PGPORT || 5432,
    });
    
    await pgClient.connect();

    console.log('Fetching PostgreSQL OSM IDs...');
    const pgRes = await pgClient.query('SELECT osm_id FROM places_spatial');
    const pgIds = new Set(pgRes.rows.map(r => parseInt(r.osm_id, 10)));
    
    console.log('Fetching MongoDB OSM IDs...');
    const mongoRes = await Place.find({}, 'osm_id').lean();
    const mongoIds = new Set(mongoRes.map(r => parseInt(r.osm_id, 10)));
    
    console.log(`Total Postgres records: ${pgIds.size}`);
    console.log(`Total Mongo records: ${mongoIds.size}`);

    let missingInMongo = 0;
    for (let id of pgIds) {
        if (!mongoIds.has(id)) missingInMongo++;
    }
    
    let missingInPostgres = 0;
    for (let id of mongoIds) {
        if (!pgIds.has(id)) missingInPostgres++;
    }

    const report = `# PostGIS ↔ MongoDB Consistency Report

## Counts
* **Total PostgreSQL Records (places_spatial):** ${pgIds.size}
* **Total MongoDB Records (places):** ${mongoIds.size}

## Consistency Check
* **Places in PostGIS but missing in MongoDB:** ${missingInMongo}
* **Places in MongoDB but missing in PostGIS:** ${missingInPostgres}

## Result
${missingInMongo === 0 && missingInPostgres === 0 ? '✅ 100% Consistent.' : '❌ Inconsistencies detected.'}
`;

    fs.writeFileSync('postgis_mongodb_consistency.md', report);
    console.log('\nConsistency Check Complete. Report written to postgis_mongodb_consistency.md');

    await pgClient.end();
    await closeDB();
};

runConsistencyCheck();

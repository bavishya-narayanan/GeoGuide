'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const env = require('../config/env');
const Place = require('../../../database/mongodb/placeModel');
const { connectMongo, closeMongo } = require('../db/mongo');

async function syncMongo() {
    await connectMongo();
    const pool = new Pool(env.spatial);

    const nullDocs = await Place.find({
        $or: [
            { name: null },
            { name: '' },
            { name: /^unnamed/i }
        ]
    }, { osm_id: 1 }).lean();

    console.log(`Found ${nullDocs.length} document(s) in MongoDB needing names.`);

    if (nullDocs.length > 0) {
        const ids = nullDocs.map((d) => Number(d.osm_id));
        const { rows } = await pool.query(
            'SELECT osm_id, name, addr_street, addr_city FROM places_spatial WHERE osm_id = ANY($1)',
            [ids]
        );

        const ops = rows.map((r) => ({
            updateOne: {
                filter: { osm_id: Number(r.osm_id) },
                update: { $set: { name: r.name } }
            }
        }));

        if (ops.length > 0) {
            const res = await Place.bulkWrite(ops);
            console.log(`Updated ${res.modifiedCount} documents in MongoDB.`);
        }
    }

    await pool.end();
    await closeMongo();
    console.log('MongoDB sync complete.');
}

syncMongo().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});

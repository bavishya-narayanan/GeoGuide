const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectDB, closeDB } = require('./connection');
const Place = require('./placeModel');

const CSV_FILE_PATH = path.join(__dirname, '..', '..', 'dataset', 'processed', 'geoguide_pois.csv');

const seedDB = async () => {
    await connectDB();
    
    // Clear existing data
    await Place.deleteMany({});
    console.log('Cleared existing places in MongoDB');

    let recordsRead = 0;
    let inserted = 0;
    let skipped = 0;
    let invalid = 0;
    
    const placesToInsert = [];
    
    console.log('Reading CSV file...');
    
    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
            recordsRead++;
            
            try {
                if (!row.osm_id || !row.category || !row.city) {
                    invalid++;
                    return;
                }
                
                const placeDoc = {
                    osm_id: parseInt(row.osm_id),
                    osm_type: row.osm_type,
                    name: row.name || null,
                    name_en: row.name_en || null,
                    name_ta: row.name_ta || null,
                    category: row.category,
                    city: row.city,
                    address: {
                        street: row.addr_street || null,
                        city: row.addr_city || null
                    },
                    contact: {
                        phone: row.phone || null,
                        website: row.website || null
                    },
                    opening_hours: row.opening_hours || null,
                    attributes: {
                        amenity: row.amenity || null,
                        tourism: row.tourism || null,
                        shop: row.shop || null,
                        leisure: row.leisure || null,
                        historic: row.historic || null,
                        healthcare: row.healthcare || null,
                        railway: row.railway || null,
                        aeroway: row.aeroway || null,
                        religion: row.religion || null,
                        operator: row.operator || null
                    }
                };
                
                placesToInsert.push(placeDoc);
            } catch (err) {
                invalid++;
            }
        })
        .on('end', async () => {
            console.log(`Finished reading. Total records read: ${recordsRead}`);
            
            if (placesToInsert.length > 0) {
                console.log('Starting bulk insert...');
                try {
                    // Use insertMany with ordered: false to skip duplicates without throwing fatal error
                    const result = await Place.insertMany(placesToInsert, { ordered: false });
                    inserted = result.length;
                    console.log(`Successfully inserted ${inserted} records.`);
                } catch (error) {
                    if (error.code === 11000) {
                        // BulkWriteError from duplicates
                        inserted = error.insertedDocs.length;
                        skipped = placesToInsert.length - inserted;
                        console.log(`Inserted ${inserted} records. Skipped ${skipped} due to duplicate osm_id.`);
                    } else {
                        console.error('Error during bulk insert:', error);
                    }
                }
            }
            
            console.log('\n--- Seed Report ---');
            console.log(`Records Read: ${recordsRead}`);
            console.log(`Inserted: ${inserted}`);
            console.log(`Skipped (Duplicates): ${skipped}`);
            console.log(`Invalid Records: ${invalid}`);
            console.log('-------------------\n');
            
            await closeDB();
        });
};

seedDB();

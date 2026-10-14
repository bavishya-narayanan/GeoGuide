const { connectDB, closeDB } = require('./connection');
const Place = require('./placeModel');

const runQueries = async () => {
    await connectDB();
    
    console.log('\n--- MongoDB GeoGuide Queries ---');

    // 1. Find all temples in Kanchipuram
    const kanchiTemples = await Place.countDocuments({ city: 'Kanchipuram', category: 'Temple' });
    console.log(`\n1. Temples in Kanchipuram: ${kanchiTemples}`);

    // 2. Find restaurants in Chennai
    const chennaiRestaurants = await Place.countDocuments({ city: 'Chennai', category: 'Restaurant' });
    console.log(`2. Restaurants in Chennai: ${chennaiRestaurants}`);

    // 3. Find hospitals in Madurai
    const maduraiHospitals = await Place.countDocuments({ city: 'Madurai', category: 'Hospital' });
    console.log(`3. Hospitals in Madurai: ${maduraiHospitals}`);

    // 4. Find the number of places grouped by city
    const byCity = await Place.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    console.log('\n4. Places by City:');
    byCity.forEach(c => console.log(`   - ${c._id}: ${c.count}`));

    // 5. Find the most common categories in each city (Top 3)
    const topCategoriesByCity = await Place.aggregate([
        { $group: { _id: { city: '$city', category: '$category' }, count: { $sum: 1 } } },
        { $sort: { '_id.city': 1, count: -1 } },
        { $group: { _id: '$_id.city', categories: { $push: { category: '$_id.category', count: '$count' } } } },
        { $project: { categories: { $slice: ['$categories', 3] } } }
    ]);
    
    console.log('\n5. Top 3 Categories per City:');
    topCategoriesByCity.forEach(c => {
        console.log(`   - ${c._id}:`);
        c.categories.forEach(cat => console.log(`       * ${cat.category} (${cat.count})`));
    });

    // 6. Places having a website
    const withWebsite = await Place.countDocuments({ 'contact.website': { $ne: null, $ne: '' } });
    console.log(`\n6. Places with Website Info: ${withWebsite}`);

    // 7. Places having phone/contact information
    const withPhone = await Place.countDocuments({ 'contact.phone': { $ne: null, $ne: '' } });
    console.log(`7. Places with Phone Info: ${withPhone}`);
    
    // 8. Search places by name keyword
    const searchRes = await Place.find({ $text: { $search: "Ganesh" } }).limit(3).select('name city category');
    console.log(`\n8. Search for 'Ganesh' (Top 3 results):`);
    searchRes.forEach(r => console.log(`   - ${r.name} (${r.category}, ${r.city})`));

    console.log('\n--------------------------------');
    
    await closeDB();
};

runQueries();

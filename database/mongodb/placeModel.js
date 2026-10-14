const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    osm_id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    osm_type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    name_en: {
        type: String,
        default: null
    },
    name_ta: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    city: {
        type: String,
        required: true,
        index: true
    },
    address: {
        street: { type: String, default: null },
        city: { type: String, default: null }
    },
    contact: {
        phone: { type: String, default: null },
        website: { type: String, default: null }
    },
    opening_hours: {
        type: String,
        default: null
    },
    attributes: {
        amenity: { type: String, default: null },
        tourism: { type: String, default: null },
        shop: { type: String, default: null },
        leisure: { type: String, default: null },
        historic: { type: String, default: null },
        healthcare: { type: String, default: null },
        railway: { type: String, default: null },
        aeroway: { type: String, default: null },
        religion: { type: String, default: null },
        operator: { type: String, default: null }
    },
    source: {
        type: String,
        default: 'OpenStreetMap'
    }
}, { timestamps: true });

// Compound index for frequent category searches within a city
placeSchema.index({ city: 1, category: 1 });
// Text index for name search
placeSchema.index({ name: 'text', name_en: 'text', name_ta: 'text' });

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;

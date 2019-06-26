const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Term Schema
 */

const TermSchema = new Schema({
    term_id: {
        type: String,
        index: true,
        unique: true,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    season: {
        type: String,
        required: true,
        enum: {
            values: ['Spring', 'Fall', 'Winter'],
        },
    },
    updated_at: {
        type: Date,
        default: new Date(),
    },
    created_at: {
        type: Date,
        immutable: true,
        default: new Date(),
    },
});

module.exports = mongoose.model('Term', TermSchema);

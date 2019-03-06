const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimestampType = require('./types/Timestamp');

/**
 * Term Schema
 */

const TermSchema = new Schema({
    term_id: {
        type: Number,
        required: [true, 'Term ID required']
    },
    year: {
        type: Number,
        required: [true, 'Term year required']
    },
    term_season: {
        type: String,
        required: [true, 'Term season required'],
        enum: {
            values: ['Spring', 'Fall', 'Winter'],
            message: props => `${props.value} is an invalid term season`
        }
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Term'
    }],
    created_at: TimestampType,
    last_updated_at: TimestampType
});

module.exports = mongoose.model('Term', TermSchema);

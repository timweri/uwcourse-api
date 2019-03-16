const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
});

module.exports = mongoose.model('Term', TermSchema);

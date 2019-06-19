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
    term_season: {
        type: String,
        required: true,
        enum: {
            values: ['Spring', 'Fall', 'Winter'],
        },
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Term',
    }],
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

TermSchema.pre('save', function (next) {
    this._update.updated_at = new Date();
    next();
});

TermSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});

TermSchema.pre('update', function (next) {
    this._update.updated_at = new Date();
    next();
});

TermSchema.pre('updateOne', function (next) {
    this._update.updated_at = new Date();
    next();
});

TermSchema.pre('updateMany', function (next) {
    this._update.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Term', TermSchema);

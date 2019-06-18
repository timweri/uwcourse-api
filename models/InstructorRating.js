const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingSchema = require('./subschemas/Rating');

/**
 * Course Rating Schema
 */

const InstructorRatingSchema = new Schema({
    course_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Course',
    },
    instructor_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Instructor',
    },
    author_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    term_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Term',
    },
    liked: RatingSchema,
    easy: RatingSchema,
    content: {
        type: String,
        required: true,
        match: ['^[a-zA-Z0-9?><;,{}[\\]\\-_+=!@#$%\\^&*|\']*$', 'Some characters are not allowed'],
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

InstructorRatingSchema.pre('save', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorRatingSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorRatingSchema.pre('update', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorRatingSchema.pre('updateOne', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorRatingSchema.pre('updateMany', function (next) {
    this._update.updated_at = new Date();
    next();
});

module.exports = mongoose.model('InstructorRating', InstructorRatingSchema);

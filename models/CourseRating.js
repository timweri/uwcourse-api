const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingSchema = require('./subschemas/Rating');

/**
 * Course Rating Schema
 */

const CourseRatingSchema = new Schema({
    course_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Course',
    },
    author_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    term_id: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    liked_rating: RatingSchema,
    easy_rating: RatingSchema,
    useful_rating: RatingSchema,
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

CourseRatingSchema.pre('save', function (next) {
    this._update.updated_at = new Date();
    next();
});

CourseRatingSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});

CourseRatingSchema.pre('update', function (next) {
    this._update.updated_at = new Date();
    next();
});

CourseRatingSchema.pre('updateOne', function (next) {
    this._update.updated_at = new Date();
    next();
});

CourseRatingSchema.pre('updateMany', function (next) {
    this._update.updated_at = new Date();
    next();
});

module.exports = mongoose.model('CourseRating', CourseRatingSchema);

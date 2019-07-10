const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OverallRatingSchema = require('./subschemas/OverallRating');

/**
 * Course Schema
 */

const CourseSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
        index: true,
    },
    catalog_number: {
        type: String,
        required: true,
        index: true,
    },
    url: String,
    // This is the course id assigned by UW Registrar
    // course_id is not unique due to crosslisting
    course_id: {
        type: String,
        required: true,
        index: true,
    },
    instructors: [{type: Schema.Types.ObjectId, ref: 'Instructor'}],
    easy_rating: OverallRatingSchema,
    useful_rating: OverallRatingSchema,
    liked_rating: OverallRatingSchema,
    rating: OverallRatingSchema,
    liked_count: {
        type: Number,
        default: 0,
        validate: {
            validator: v => Number.isInteger(v) && v >= 0,
            message: 'liked_count is not a natural number',
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

module.exports = mongoose.model('Course', CourseSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CourseDetail = require('./CourseDetail');
const Term = require('./Term');
const OverallRatingSchema = require('./subschemas/OverallRating');

/**
 * Course Schema
 */

const CourseSchema = new Schema({
    subject: {
        type: String,
        required: [true, 'SUBJECT_REQUIRED'],
        index: true,
    },
    catalog_number: {
        type: String,
        required: [true, 'CATALOG_NUMBER_REQUIRED'],
        index: true,
    },
    uw_course_id: {
        type: String,
        required: [true, 'UW_COURSE_ID_MISSING'],
        index: true,
    },
    easy_rating: {
        type: OverallRatingSchema,
        default: {
            value: 0,
            count: 0,
        },
    },
    useful_rating: {
        type: OverallRatingSchema,
        default: {
            value: 0,
            count: 0,
        },
    },
    liked_rating: {
        type: OverallRatingSchema,
        default: {
            value: 0,
            count: 0,
        },
    },
    // instructors: [{type: Schema.Types.ObjectId, ref: 'Instructor'}],
    bookmark_count: {
        type: Number,
        default: 0,
        validate: {
            validator: v => Number.isInteger(v) && v >= 0,
            message: 'INVALID_BOOKMARK_COUNT',
        },
    },
    latest_term: {type: Schema.Types.ObjectId, ref: 'Term', default: null},
    latest_detail: {type: Schema.Types.ObjectId, ref: 'CourseDetail', default: null},
    academic_level: String,
    keywords: [{type: String, index: true}],
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

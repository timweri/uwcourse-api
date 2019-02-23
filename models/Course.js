const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimestampType = require('./types/Timestamp');
const CompactCourseRatingType = require('./types/CompactCourseRating');
const CompactInstructorRatingType = require('./types/CompactInstructorRating');
const OverallRatingType = require('./types/OverallRating');

/**
 * Course Schema Subdocuments
 */

const OfferingSchema = new Schema({
    online: Boolean,
    online_only: Boolean,
    st_jerome: Boolean,
    st_jerome_only: Boolean,
    renison: Boolean,
    renison_only: Boolean,
    conrad_grebel: Boolean,
    conrad_grebel_only: Boolean
});

/**
 * Course Schema
 */

const CourseSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Course title required'],
    },
    subject: {
        type: String,
        required: [true, 'Course subject required'],
    },
    catalog_number: {
        type: String,
        required: [true, 'Course catalog number required'],
    },
    url: {
        type: String
    },
    uw_id: {
        type: String,
        required: [true, 'UW Course ID required'],
    },
    units: {
        type: Number,
        required: [true, 'Course unit worth required']
    },
    academic_level: String,
    instructions: [String],
    instructors: [{
        id: {
            type: Schema.Types.ObjectId,
            required: [true, 'Instructor id required'],
            ref: 'Instructor'
        },
        avatar_url: String,
        name: String,
        easy_rating: OverallRatingType('Instructor easy'),
        liked_rating: OverallRatingType('Instructor liked'),
        ratings: [CompactInstructorRatingType]
    }],
    easy_rating: OverallRatingType('Course easy'),
    useful_rating: OverallRatingType('Course useful'),
    liked_rating: OverallRatingType('Course liked'),
    ratings: [CompactCourseRatingType],
    prerequisites: String,
    antirequisites: String,
    corequisites: String,
    crosslistings: String,
    terms_offered: [{type: Schema.Types.ObjectId, ref: 'Term'}],
    offerings: OfferingSchema,
    needs_department_consent: Boolean,
    needs_instructor_consent: Boolean,
    notes: String,
    calendar_year: String,
    extra: [],
    created_at: TimestampType,
    last_updated_at: TimestampType
});

module.exports = mongoose.model('Course', CourseSchema);

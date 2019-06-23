const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OverallRatingSchema = require('./subschemas/OverallRating');

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
    conrad_grebel_only: Boolean,
}, {_id: false});

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
    units: {
        type: Number,
        required: true,
    },
    description: String,
    academic_level: String,
    instructions: [String],
    instructors: [{
        _id: {type: Schema.Types.ObjectId, ref: 'Instructor'},
        avatar_url: String,
        name: String,
        easy_rating: OverallRatingSchema,
        liked_rating: OverallRatingSchema,
        ratings: [{type: Schema.Types.ObjectId, ref: 'InstructorRating'}],
    }],
    easy_rating: OverallRatingSchema,
    useful_rating: OverallRatingSchema,
    liked_rating: OverallRatingSchema,
    ratings: [{type: Schema.Types.ObjectId, ref: 'CourseRating'}],
    prerequisites: String,
    antirequisites: String,
    corequisites: String,
    crosslistings: String,
    terms_offered: [String],
    term_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Term',
    },
    offerings: OfferingSchema,
    needs_department_consent: Boolean,
    needs_instructor_consent: Boolean,
    notes: String,
    extra: [],
    schedule: [{type: Schema.Types.ObjectId, ref: 'CourseSchedule'}],
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

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const approot = require('app-root-path');
const Timestamp = require(`${approot}/utils/timestamp`);
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
            index: true
        },
        catalog_number: {
            type: String,
            required: [true, 'Course catalog number required'],
            index: true
        },
        url: {
            type: String
        },
        // This is the course id assigned by UW Registrar
        // course_id is not unique due to crosslisting
        course_id: {
            type: String,
            required: [true, 'UW Course ID required'],
            index: true
        },
        units: {
            type: Number,
            required: [true, 'Course unit worth required']
        },
        description: String,
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
        extra: [],
        updated_at: {
            type: String,
            default: Timestamp.generateTimestamp
        }
    },
    {
        upsertMatchFields: ['course_id', 'subject', 'catalog_number']
    }
);

CourseSchema.pre('save', function (next) {
    this._update.updated_at = Timestamp.generateTimestamp();
    next();
});

CourseSchema.pre('update', function (next) {
    this._update.updated_at = Timestamp.generateTimestamp();
    next();
});

module.exports = mongoose.model('Course', CourseSchema);

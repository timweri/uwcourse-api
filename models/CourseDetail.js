const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseScheduleSchema = require('./subschemas/CourseSchedule');

/**
 * Course Detail Schema Subdocuments
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
 * Course Detail Schema
 */

const CourseDetailSchema = new Schema({
    term_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'TERM_ID_REQUIRED'],
        ref: 'Term',
        index: true,
    },
    course_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'COURSE_ID_REQUIRED'],
        ref: 'Course',
        index: true,
    },
    units: Number,
    title: String,
    description: String,
    instructions: [String],
    // instructors: [{type: Schema.Types.ObjectId, ref: 'Instructor'}],
    prerequisites: String,
    antirequisites: String,
    corequisites: String,
    crosslistings: String,
    offerings: OfferingSchema,
    needs_department_consent: Boolean,
    needs_instructor_consent: Boolean,
    terms_offered: [String],
    notes: String,
    extra: [String],
    url: String,
    schedule: {
        type: [CourseScheduleSchema],
        default: [],
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

module.exports = mongoose.model('CourseDetail', CourseDetailSchema);

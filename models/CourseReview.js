const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Course Review Schema
 */

const CourseReviewSchema = new Schema({
    course_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'COURSE_ID_REQUIRED'],
        ref: 'Course',
        index: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'USER_ID_REQUIRED'],
        ref: 'User',
        index: true,
    },
    term_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'TERM_ID_REQUIRED'],
    },
    easy_rating: {
        type: Number,
        validate: {
            validator: Number.isInteger,
        },
        min: 1,
        max: 5,
        required: [true, 'EASY_RATING_REQUIRED'],
    },
    useful_rating: {
        type: Number,
        validate: {
            validator: Number.isInteger,
        },
        min: 1,
        max: 5,
        required: [true, 'USEFUL_RATING_REQUIRED'],
    },
    content: {
        type: String,
        required: [true, 'CONTENT_REQUIRED'],
        match: [/^[a-zA-Z0-9?><;,{}[\]-_+=!@#$%\\^&*|' ]*$/, 'FORBIDDEN_CHARACTER_IN_CONTENT'],
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

module.exports = mongoose.model('CourseReview', CourseReviewSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimestampType = require('./types/timestamp');
const RatingType = require('./types/rating');

/**
 * Course Rating Schema
 */

const InstructorRatingSchema = new Schema({
    course_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Course reference required'],
        ref: 'Course'
    },
    instructor_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Instructor id required'],
        ref: 'Instructor'
    },
    author_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Author reference required'],
        ref: 'User'
    },
    term_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Term reference required'],
        ref: ''
    },
    liked: RatingType('Liked rating required'),
    easy: RatingType('Easy rating required'),
    content: {
        type: String,
        required: [true, 'Content required'],
        match: ['^[a-zA-Z0-9?><;,{}[\\]\\-_+=!@#$%\\^&*|\']*$', 'Some characters are not allowed']
    },
    created_at: TimestampType,
    last_updated_at: TimestampType
});

module.exports = mongoose.model('InstructorRating', InstructorRatingSchema);

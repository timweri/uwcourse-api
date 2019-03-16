const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingType = require('./types/Rating');

/**
 * Course Rating Schema
 */

const CourseRatingSchema = new Schema({
    course_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Course reference required'],
        ref: 'Course'
    },
    author_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Author reference required'],
        ref: 'User'
    },
    term_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Term reference required']
    },
    liked_rating: RatingType('Liked rating required'),
    easy_rating: RatingType('Easy rating required'),
    useful_rating: RatingType('Useful rating required'),
    content: {
        type: String,
        required: [true, 'Content required'],
        match: ['^[a-zA-Z0-9?><;,{}[\\]\\-_+=!@#$%\\^&*|\']*$', 'Some characters are not allowed']
    },
});

module.exports = mongoose.model('CourseRating', CourseRatingSchema);

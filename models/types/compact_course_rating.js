const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompactRatingAuthorType = require('./compact_rating_author');
const RatingType = require('./rating');

module.exports = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Course rating reference required'],
        ref:'CourseRating'
    },
    author: CompactRatingAuthorType,
    content: String,
    easy_rating: RatingType('Easy rating required'),
    useful_rating: RatingType('Useful rating required'),
    liked_rating: RatingType('Liked rating required'),
    date: String
});

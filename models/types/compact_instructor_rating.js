const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompactRatingAuthorType = require('./compact_rating_author');
const RatingType = require('./rating');

module.exports = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Instructor rating reference required'],
        ref:'InstructorRating'
    },
    author: CompactRatingAuthorType,
    content: String,
    easy_rating: RatingType('Easy rating required'),
    liked_rating: RatingType('Liked rating required'),
    date: String
});

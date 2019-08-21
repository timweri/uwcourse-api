const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: 'User'},
    course_id: {type: Schema.Types.ObjectId, ref: 'Course'},
    value: {
        type: Number,
        validate: {
            validator: Number.isInteger,
        },
        min: -1,
        max: 1,
        default: 0,
    },
}, {_id: false});

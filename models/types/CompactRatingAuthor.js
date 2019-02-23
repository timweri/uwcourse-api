const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        required: [true, 'Author reference required'],
        ref: 'User'
    },
    anonymous: {
        type: Boolean,
        default: true
    },
    faculty: String,
    program: String,
});

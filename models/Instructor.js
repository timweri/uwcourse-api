const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimestampType = require('./types/Timestamp');

/**
 * Instructor Scheme
 */

const InstructorSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name required']
    },
    role: {
        type: String,
        required: [true, 'Instructor role required'],
        enum: {
            values: ['Prof', 'TA'],
            message: props => `${props.value} is an invalid instructor role`
        },
    },
    avatar_url: {type: String, default: ''},
    email: String,
    office: String,
    created_at: TimestampType,
    last_updated_at: TimestampType
});

module.exports = mongoose.model('Instructor', InstructorSchema);

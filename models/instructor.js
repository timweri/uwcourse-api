const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
});

module.exports = mongoose.model('Instructor', InstructorSchema);

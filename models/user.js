const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const faculty_program_validator = require('../utils/database/validator/validate_faculty_program');

/**
 * User Schema Subdocuments
 */

const CompactCourse = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course reference missing']},
    title: {type: String, required: [true, 'Course title missing']},
    subject: {type: String, required: [true, 'Course subject missing'], match: ''},
    catalog: {type: String, required: [true, 'Course catalog number missing']},
    rating: new Schema({
        value: {type: Number, required: [true, 'Course rating missing']},
        count: {type: Number, required: [true, 'Course rating count missing']}
    })
});

const CompactTerm = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'Term', required: [true, 'Term reference missing']},
    title: {type: String, required: [true, 'Term title required']},
    courses: [CompactCourse]
});

/**
 * User Schema
 */

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name required'],
        match: [`^[a-zA-Z -']+$`, 'Special characters and numbers not allowed']
    },
    email: {
        type: String,
        required: [true, 'Email required'],
        match: ['^[^\\s@]+@(edu.)??uwaterloo.ca$', 'Invalid UWaterloo email format'],
        index: true,
        unique: true
    },
    avatar_url: {type: String, default: ''},
    hashed_password: {type: String, required: [true, 'Password required']},
    faculty: {
        type: String,
        enum: {
            values: faculty_program_validator.possible_faculty,
            message: props => `${props.value} is an invalid faculty`
        },
        required: [true, 'Faculty required']
    },
    program: {
        type: Number,
        required: [true, 'Program required'],
        validate: {
            validator: faculty_program_validator.validate_program,
            message: props => `${props.value} is an invalid program`
        }
    },
    favourite_courses: [CompactCourse],
    terms: [CompactTerm]
});

module.exports = mongoose.model('User', UserSchema);

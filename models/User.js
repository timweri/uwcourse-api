const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const argon2 = require('argon2');
const Timestamp = require('../utils/timestamp');
const faculty_program_validator = require('../utils/database/validators/validate_faculty_program');
const OverallRatingType = require('./types/OverallRating');

/**
 * User Schema Subdocuments
 */

const CompactCourse = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course reference missing']},
    title: {type: String, required: [true, 'Course title missing']},
    subject: {type: String, required: [true, 'Course subject missing'], match: ''},
    catalog_number: {type: String, required: [true, 'Course catalog number missing']},
    liked_rating: OverallRatingType('Course liked')
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
        match: [/^[a-zA-Z -']+$/, 'Special characters and numbers not allowed']
    },
    email: {
        type: String,
        required: [true, 'Email required'],
        match: [/^[^\\@]+@(edu.)??uwaterloo.ca$/, 'Invalid UWaterloo email format'],
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
        type: String,
        required: [true, 'Program required'],
        validate: {
            validator: function() {
                return new Promise((resolve, reject) => {
                    if (faculty_program_validator.valid_programs[this.faculty].includes(this.program)){
                        resolve(true);
                    }
                    else{
                        reject(false);
                    }
                });
            },
            message: props => `${props.value} is an invalid program`
        }
    },
    favourite_courses: [CompactCourse],
    terms: [CompactTerm],
    created_at: {
        type: String,
        default: Timestamp.generateTimestamp
    },
    last_updated_at: {
        type: String,
        default: Timestamp.generateTimestamp
    }
});


// encrypt password before save
UserSchema.pre('save', async function(next) {
    const user = this;

    try {
        const hash = await argon2.hash(user.hashed_password);
        user.hashed_password = hash;
        next();
    } catch (err) {
        console.log('Error hashing password for user', user.name);
        next(err);
    }
});


module.exports = mongoose.model('User', UserSchema);

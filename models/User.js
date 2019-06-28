const approot = require('app-root-path');
const mongoose = require('mongoose');
const emailValidator = require(`${approot}/utils/users/validators/email_validator`);
const Schema = mongoose.Schema;


const facultyProgramValidator = require(`${approot}/utils/database/validators/validate_faculty_program`);

/**
 * User Schema
 */

const UserSchema = new Schema({
    name: {
        type: String,
        match: [
            /^[a-zA-Z -']+$/,
            'Special characters and numbers not allowed',
            'invalid',
        ],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        index: true,
        unique: true,
        validate: [
            async (value) => {
                return emailValidator.test(value);
            },
            'Invalid email',
            'invalid',
        ],
    },
    avatar_url: {
        type: String,
        default: '',
    },
    password: {
        type: String,
        required: [true, 'Password is missing'],
    },
    faculty: {
        type: String,
        enum: {
            values: facultyProgramValidator.POSSIBLE_FACULTY,
            message: 'Invalid faculty',
            type: 'invalid',
        },
    },
    program: {
        type: String,
        validate: [
            (value) => {
                return facultyProgramValidator.VALID_PROGRAMS[this.faculty].includes(value);
            },
            'Invalid',
            'invalid',
        ],
    },
    favourite_courses: [{type: Schema.Types.ObjectId, ref: 'Course'}],
    terms: [{type: Schema.Types.ObjectId, ref: 'Term'}],
    last_login_at: Date,
    updated_at: {
        type: Date,
        default: new Date(),
    },
    created_at: {
        type: Date,
        immutable: true,
        default: new Date(),
    },
});

// Update updated_at timestamp
UserSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

UserSchema.pre('update', function (next) {
    this._update.updated_at = new Date();
    next();
});

UserSchema.pre('updateOne', function (next) {
    this._update.updated_at = new Date();
    next();
});

const User = mongoose.model('User', UserSchema);

// Check duplicate email
User.schema.path('email').validate(async (value) => {
    try {
        const user = await User.findOne({email: value});
        return (user === null);
    } catch (err) {
        throw err;
    }
}, 'Email already exists', 'exists');

module.exports = User;

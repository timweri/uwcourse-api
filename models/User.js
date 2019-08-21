const approot = require('app-root-path');
const mongoose = require('mongoose');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const Schema = mongoose.Schema;
const config = require(`${approot}/config/config`);

const facultyProgramValidator = require(`${approot}/utils/users/validators/faculty_program_validator`);
const Term = require('./Term');
const Course = require('./Course');
const LikeDislikeSchema = require('./subschemas/LikeDislike');

/**
 * User Schema
 */

const UserSchema = new Schema({
    name: {
        type: String,
        maxlength: [32, 'NAME_TOO_LONG'],
        minlength: [2, 'NAME_TOO_SHORT'],
        required: [true, 'NAME_REQUIRED'],
        match: [
            new RegExp("^[A-Za-z,. '-]+$"),
            'INVALID_NAME',
        ],
    },
    username: {
        type: String,
        required: [true, 'USERNAME_REQUIRED'],
        index: true,
        unique: true,
        match: [
            new RegExp('^[a-z0-9]{6,12}$'),
            'INVALID_USERNAME',
        ],
    },
    avatar_url: {
        type: String,
        default: '',
    },
    password: {
        type: String,
        required: [true, 'PASSWORD_MISSING'],
    },
    token_key: {
        type: String,
        required: [true, 'TOKEN_KEY_MISSING'],
        minlength: [config.token_key_length, 'TOKEN_KEY_TOO_SHORT'],
        maxlength: [config.token_key_length, 'TOKEN_KEY_TOO_LONG'],
    },
    faculty: {
        type: String,
        required: [true, 'FACULTY_MISSING'],
    },
    program: {
        type: String,
        required: [true, 'PROGRAM_MISSING'],
    },
    bookmark_courses: {
        type: [{type: Schema.Types.ObjectId, ref: 'Course'}],
        default: [],
    },
    taken_courses: {
        // map of Term._id to [Course._id]
        type: Map,
        of: [{type: Schema.Types.ObjectId, ref: 'Course'}],
        default: {},
    },
    liked_courses: {
        type: [{type: Schema.Types.ObjectId, ref: 'Course'}],
        default: [],
    },
    like_dislike: {
        type: [LikeDislikeSchema],
        default: [],
    },
    last_login_at: {
        type: Date,
        default: null,
    },
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

// Validate faculty and program
UserSchema.pre('save', function (next) {
    const faculty = this.faculty;
    const program = this.program;
    const validationError = new mongoose.Error.ValidationError(null);

    if (faculty == null) {
        validationError.addError(
            'faculty',
            new mongoose.Error.ValidatorError({
                path: 'faculty',
                message: 'FACULTY_MISSING',
                kind: 'exists',
            }),
        );
        return next(validationError);
    }

    if (program == null) {
        validationError.addError(
            'program',
            new mongoose.Error.ValidatorError({
                path: 'program',
                message: 'PROGRAM_MISSING',
                kind: 'exists',
            }),
        );
        return next(validationError);
    }

    if (!facultyProgramValidator.validateFaculty(faculty)) {
        validationError.addError(
            'faculty',
            new mongoose.Error.ValidatorError({
                path: 'faculty',
                message: 'INVALID_FACULTY',
                kind: 'invalid',
            }),
        );
        return next(validationError);
    }

    if (!facultyProgramValidator.validateProgram(faculty, program)) {
        validationError.addError(
            'program',
            new mongoose.Error.ValidatorError({
                path: 'program',
                message: 'INVALID_PROGRAM',
                kind: 'invalid',
            }),
        );
        return next(validationError);
    }

    next();
});

UserSchema.pre(/^(update|updateOne|findOneAndUpdate)$/, function (next) {
    let faculty;
    let program;
    const validationError = new mongoose.Error.ValidationError(null);

    if (this._update && this._update.$set) {
        faculty = this._update.$set.faculty;
        program = this._update.$set.program;
    }

    if (faculty == null && program == null) return next();

    if (faculty == null) {
        validationError.addError(
            'faculty',
            new mongoose.Error.ValidatorError({
                path: 'faculty',
                message: 'FACULTY_MISSING',
                kind: 'exists',
            }),
        );
        return next(validationError);
    }

    if (program == null) {
        validationError.addError(
            'program',
            new mongoose.Error.ValidatorError({
                path: 'program',
                message: 'PROGRAM_MISSING',
                kind: 'exists',
            }),
        );
        return next(validationError);
    }

    if (!facultyProgramValidator.validateFaculty(faculty)) {
        validationError.addError(
            'faculty',
            new mongoose.Error.ValidatorError({
                path: 'faculty',
                message: 'INVALID_FACULTY',
                kind: 'invalid',
            }),
        );
        return next(validationError);
    }

    if (!facultyProgramValidator.validateProgram(faculty, program)) {
        validationError.addError(
            'program',
            new mongoose.Error.ValidatorError({
                path: 'program',
                message: 'INVALID_PROGRAM',
                kind: 'invalid',
            }),
        );
        return next(validationError);
    }

    next();
});

// Synchronize updated_at timestamp for new user document
UserSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

// Populate taken courses
UserSchema.method('populateTakenCourses', async function () {
    const new_taken_courses = {};
    for (const [term_id, courses] of this.taken_courses) {
        const term = await Term.findById(term_id);
        if (!term) {
            throw new Error(`Term._id ${term_id} found in \`taken_courses\` of User ${this._id} does not exist`);
        }
        new_taken_courses[term_id] = {
            uw_term_id: term.uw_term_id,
            year: term.year,
            season: term.season,
        };
        new_taken_courses[term_id].courses = await Course.populate(courses);
    }
    return new_taken_courses;
});

const User = mongoose.model('User', UserSchema);

// Check duplicate username
User.schema.path('username')
    .validate(async function (value) {
        if (!this.isNew) return true;
        const user = await User.findOne({username: value});
        return (user === null);
    }, 'USERNAME_EXISTS', 'exists');

module.exports = User;

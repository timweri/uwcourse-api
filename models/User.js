const approot = require('app-root-path');
const mongoose = require('mongoose');
const emailValidator = require(`${approot}/utils/users/validators/email_validator`);
const Schema = mongoose.Schema;
const config = require(`${approot}/config/config`);

const facultyProgramValidator = require(`${approot}/utils/users/validators/faculty_program_validator`);

/**
 * User Schema
 */

const UserSchema = new Schema({
    name: {
        type: String,
        maxlength: [64, 'Name is too long'],
        minlength: [2, 'Name is too short'],
        match: [
            new RegExp(
                '^[A-Za-z]' + // Only letter at the start
                '(?!.*[ ]{2})' + // No two spaces in the middle
                '(?!.*[.]{2})' + // No two dots in the middle
                '(?!.*[,]{2})' + // No two commas in the middle
                '(?!.*[\']{2})' + // No two single quote mark in the middle
                '(?!.*[-]{2})' + // No two dashes in the middle
                '(?!.*[ ]$)' + // No space at the end
                '[A-Za-z .,\'-]+' + // Accept only these character
                '$',
            ),
            'Name contains forbidden characters, characters at forbidden positions or forbidden combination of characters',
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
    token_key: {
        type: String,
        required: [true, 'Token key is missing'],
        minlength: [config.app.token_key_length, `Token key length must be ${config.app.token_key_length}`],
        maxlength: [config.app.token_key_length, `Token key length must be ${config.app.token_key_length}`],
    },
    faculty: {
        type: String,
    },
    program: {
        type: String,
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

// Validate faculty and program
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
                message: 'Missing faculty',
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
                message: 'Missing program',
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
                message: 'Invalid faculty',
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
                message: 'Invalid program',
                kind: 'invalid',
            }),
        );
        return next(validationError);
    }

    next();
});

// Update updated_at timestamp or existing user document
UserSchema.pre(/^(update|updateOne|findOneAndUpdate)$/, function (next) {
    this._update.updated_at = new Date();
    next();
});

// Synchronize updated_at timestamp for new user document
UserSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.updated_at = new Date();
    }
    next();
});

const User = mongoose.model('User', UserSchema);

// Check duplicate email
User.schema.path('email')
    .validate(async (value) => {
        try {
            const user = await User.findOne({email: value});
            return (user === null);
        } catch (err) {
            throw err;
        }
    }, 'Email already exists', 'exists');

module.exports = User;

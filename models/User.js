const approot = require('app-root-path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const facultyProgramValidator = require(`${approot}/utils/database/validators/validate_faculty_program`);

/**
 * Error Codes
 */
const error_codes = {
    OK: 0,
    DUPLICATE_EMAIL: 1,
};

/**
 * User Schema
 */

const UserSchema = new Schema({
        name: {
            type: String,
            match: [/^[a-zA-Z -']+$/, 'Special characters and numbers not allowed'],
        },
        email: {
            type: String,
            required: true,
            index: true,
            unique: true,
        },
        avatar_url: {
            type: String,
            default: '',
        },
        password: {
            type: String,
            required: true,
        },
        faculty: {
            type: String,
            enum: {
                values: facultyProgramValidator.POSSIBLE_FACULTY,
            },
        },
        program: {
            type: String,
            validate: {
                validator: (v) => {
                    return facultyProgramValidator.VALID_PROGRAMS[this.faculty].includes(v);
                },
            },
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
    },
    {
        defaultBulkMatchFields: ['email'],
    }
);

// Check duplicate email
UserSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        let newError = new Error('Email already exists');
        newError.code = error_codes.DUPLICATE_EMAIL;
        next(newError);
    } else {
        next();
    }
});

// Update updated_at timestamp
UserSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.updated_at = new Date();
    } else if (this.isNew) {
        this.updated_at = this.created_at;
    }
    next();
});

UserSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
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

UserSchema.pre('updateMany', function (next) {
    this._update.updated_at = new Date();
    next();
});

let model = mongoose.model('User', UserSchema);
model.error_codes = error_codes;
module.exports = model;

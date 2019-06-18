const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Instructor Scheme
 */

const InstructorSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name required'],
    },
    role: {
        type: String,
        required: [true, 'Instructor role required'],
        enum: {
            values: ['Prof', 'TA'],
        },
    },
    avatar_url: {type: String, default: ''},
    email: String,
    office: String,
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

InstructorSchema.pre('save', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorSchema.pre('update', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorSchema.pre('updateOne', function (next) {
    this._update.updated_at = new Date();
    next();
});

InstructorSchema.pre('updateMany', function (next) {
    this._update.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Instructor', InstructorSchema);

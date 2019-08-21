const approot = require('app-root-path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require(`${approot}/config/config`);

/**
 * User Confirmation Code Schema
 */

const UserConfirmationCodeSchema = new Schema({
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
    confirmation_code: {
        type: String,
        minlength: [config.confirmation_code.length, 'INVALID_CONFIRMATION_CODE'],
        maxlength: [config.confirmation_code.length, 'INVALID_CONFIRMATION_CODE'],
        required: [true, 'CONFIRMATION_CODE_REQUIRED'],
        index: true,
        unique: true,
    },
    type: {
        type: String,
        required: [true, 'CONFIRMATION_CODE_TYPE_REQUIRED'],
        enum: {
            values: ['REGISTRATION'],
            message: 'INVALID_CONFIRMATION_CODE_TYPE',
        },
    },
    created_at: {
        type: Date,
        expires: config.confirmation_code.expiry,
        default: new Date(),
    },
});

module.exports = mongoose.model('UserConfirmationCode', UserConfirmationCodeSchema);

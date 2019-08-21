const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const config = require(`${approot}/config/config`);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const UserConfirmationCode = require(`${approot}/models/UserConfirmationCode`);
const argon2 = require('argon2');
const cryptoRandomString = require('crypto-random-string');
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);
const passwordValidator = require(`${approot}/utils/users/validators/password_validator`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const {username, confirmation_code} = req.query;
        const {name, password, faculty, program} = req.body;

        const confirmationCodeDocument = await UserConfirmationCode.findOne({username, confirmation_code});
        if (!confirmationCodeDocument || confirmationCodeDocument.type !== 'REGISTRATION') {
            return next(buildErrorResponse('INVALID_CONFIRMATION_CODE', 403));
        }

        if (!req.body.hasOwnProperty('name')) {
            return next(buildErrorResponse('NAME_REQUIRED', 400));
        }

        if (!req.body.hasOwnProperty('password')) {
            return next(buildErrorResponse('PASSWORD_REQUIRED', 400));
        }

        if (!req.body.hasOwnProperty('faculty')) {
            return next(buildErrorResponse('FACULTY_REQUIRED', 400));
        }

        if (!req.body.hasOwnProperty('program')) {
            return next(buildErrorResponse('PROGRAM_REQUIRED', 400));
        }

        if (!passwordValidator.test(password)) {
            return next(buildErrorResponse('INVALID_PASSWORD', 400));
        }

        const hashed_password = await argon2.hash(password);
        const token_key = cryptoRandomString({length: config.token_key_length});

        const user = new User({
            username,
            name,
            faculty,
            program,
            token_key,
            password: hashed_password,
            updated_at: new Date(),
            created_at: new Date(),
        });

        await user.save();
        await confirmationCodeDocument.remove();

        logger.info(`Created user ${username}`);
        logger.info(`Returning 201 with body {id: ${user._id}}`);
        res.status(201).send({
            id: user._id,
        });
    } catch (err) {
        next(err);
    }
};

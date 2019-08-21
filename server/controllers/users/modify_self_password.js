const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const cryptoRandomString = require('crypto-random-string');
const argon2 = require('argon2');
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);
const passwordValidator = require(`${approot}/utils/users/validators/password_validator`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const user = req.token.user;
        const {old_password, new_password} = req.body;

        if (!old_password) {
            return next(buildErrorResponse('OLD_PASSWORD_REQUIRED', 401));
        }

        if (!new_password) {
            return next(buildErrorResponse('NEW_PASSWORD_REQUIRED', 400));
        }

        if (new_password === old_password) {
            return next(buildErrorResponse('IDENTICAL_OLD_NEW_PASSWORD', 400));
        }

        if (!passwordValidator.test(new_password)) {
            return next(buildErrorResponse('INVALID_NEW_PASSWORD', 400));
        }

        if (await argon2.verify(user.password, old_password)) {
            user.password = await argon2.hash(new_password);
            user.token_key = cryptoRandomString({length: config.token_key_length});
            user.updated_at = new Date();
            await user.save();
        } else {
            return next(buildErrorResponse('WRONG_USERNAME_PASSWORD', 401));
        }

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

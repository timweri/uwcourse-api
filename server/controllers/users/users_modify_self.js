const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const argon2 = require('argon2');
const randomstring = require('randomstring');
const config = require(`${approot}/config/config`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);
const passwordValidator = require(`${approot}/utils/users/validators/password_validator`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    const user = req.user;
    const changes = {$set: {}, $addToSet: {}};

    for (const key in req.body) {
        let newErr;
        if (req.body.hasOwnProperty(key)) {
            switch (key) {
                case 'name':
                case 'avatar_url':
                case 'faculty':
                case 'program':
                    changes.$set[key] = req.body[key];
                    break;
                case 'old_password':
                    break;
                case 'new_password':
                    if (!req.body.hasOwnProperty('old_password')) {
                        logger.info(`Failed to authenticate password change for ${user.email}: Missing old password`);
                        return next(errorBuilder('Missing old password'), 400);
                    }

                    if (req.body.old_password === req.body.new_password) {
                        logger.info(`Failed to authenticate password change for ${user.email}: Identical password`);
                        return next(errorBuilder('Identical new and old password', 400));
                    }

                    // Validate new password
                    if (!passwordValidator.test(req.body[key])) {
                        logger.info(`Failed to authenticate password change for ${user.email}: Invalid new password`);
                        return next(errorBuilder('Invalid new password', 400));
                    }

                    // Check old password
                    try {
                        if (!await argon2.verify(user.password, req.body.old_password)) {
                            logger.info(`Failed to authenticate password change for ${user.email}: Wrong password`);
                            return next(errorBuilder('Authentication failed: Wrong old password', 401));
                        }
                    } catch (err) {
                        logger.error(`Failed to verify argon2 password ${user.password}`);
                        return next(err);
                    }

                    try {
                        changes.$set.password = await argon2.hash(req.body[key]);
                    } catch (err) {
                        logger.error('Failed to hash password');
                        return next(err);
                    }

                    // Change token key
                    changes.$set.token_key = randomstring.generate(config.app.token_key_length);

                    break;
                default:
                    logger.info(newErr.message);
                    return next(errorBuilder(`Cannot modify field ${key}`, 400));
            }
        }
    }

    try {
        await user.updateOne(changes, {runValidators: true});
    } catch (err) {
        return next(err);
    }

    response.data = 'Successfully updated profile';
    logger.info(`Successfully updated ${user.username}'s profile`);
    res.status(200).send(response);
};

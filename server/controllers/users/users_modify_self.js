const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const argon2 = require('argon2');
const randomstring = require('randomstring');
const config = require(`${approot}/config/config`);

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
                        const newErr = new Error('Missing old password');
                        newErr.status = 400;
                        next(newErr);
                        logger.info(`Failed to authenticate password change for ${user.email}: Missing old password`);
                        return;
                    }

                    if (req.body.old_password === req.body.new_password) {
                        const newErr = new Error('Identical new and old password');
                        newErr.status = 400;
                        next(newErr);
                        logger.info(`Failed to authenticate password change for ${user.email}: Identical password`);
                        return;
                    }

                    // Validate new password
                    if (!passwordValidator.test(req.body[key])) {
                        const newErr = new Error('Invalid new password');
                        newErr.status = 400;
                        next(newErr);
                        logger.info(`Failed to authenticate password change for ${user.email}: Invalid new password`);
                        return;
                    }

                    // Check old password
                    try {
                        if (!await argon2.verify(user.password, req.body.old_password)) {
                            const newErr = new Error('Authentication failed: Wrong old password');
                            newErr.status = 401;
                            next(newErr);
                            logger.info(`Failed to authenticate password change for ${user.email}: Wrong password`);
                            return;
                        }
                    } catch (err) {
                        err.status = 500;
                        next(err);
                        logger.error(`Failed to verify argon2 password ${user.password}`);
                        return;
                    }

                    try {
                        changes.$set.password = await argon2.hash(req.body[key]);
                    } catch (err) {
                        const newErr = new Error();
                        newErr.status = 500;
                        next(newErr);
                        logger.error('Failed to hash password');
                        return;
                    }

                    // Change token key
                    changes.$set.token_key = randomstring.generate(config.app.token_key_length);

                    break;
                case 'favourite_courses':
                    changes.$addToSet[key] = req.body[key];
                    break;
                case 'terms':
                    break;
                default:
                    newErr = new Error(`Cannot modify field ${key}`);
                    newErr.status = 400;
                    next(newErr);
                    logger.info(newErr.message);
                    return;
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

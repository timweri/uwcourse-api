const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require(`${approot}/config/config`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const result = {};

    if (!req.hasOwnProperty('body') || !req.body.hasOwnProperty('email') || !req.body.hasOwnProperty('password')) {
        const newErr = new Error('Missing Email and/or Password');
        newErr.status = 400;
        return next(newErr);
    }

    const {email, password} = req.body;

    let user;
    try {
        user = await User.findOne({email}, ['password', 'token_key']);
    } catch (err) {
        err.status = 500;
        next(err);
        logger.error('Failed to access User model');
        return;
    }

    if (!user) {
        const newErr = new Error('User email not found');
        newErr.status = 400;
        next(newErr);
        logger.info(`User email (${email}) not found`);
        return;
    }

    try {
        if (await argon2.verify(user.password, password)) {
            user.last_login_at = new Date();
            await user.save();
            logger.info(`${email} logged in successfully`);
            result.status = 200;
            result.result = jwt.sign({email, token_key: user.token_key}, config.secret, {expiresIn: '3h'});
        } else {
            const newErr = new Error('Authentication failed: Wrong password');
            newErr.status = 401;
            next(newErr);
            logger.info(`Failed to authenticate ${email}: Wrong password`);
            return;
        }
    } catch (err) {
        err.status = 500;
        next(err);
        logger.error(`Failed to verify argon2 password ${user.password}`);
        return;
    }
    res.status(result.status).send(result);
};

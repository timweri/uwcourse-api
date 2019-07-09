const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require(`${approot}/config/config`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
        const newErr = new Error('Missing username and/or password');
        newErr.status = 400;
        return next(newErr);
    }

    const password = req.body.password;
    const username = req.body.username.toLowerCase();

    let user;
    try {
        user = await User.findOne({username}, ['password', 'token_key']);
    } catch (err) {
        err.status = 500;
        next(err);
        logger.error('Failed to access User model');
        return;
    }

    if (!user) {
        const newErr = new Error('User not found');
        newErr.status = 400;
        next(newErr);
        logger.info(`User (${username}) not found`);
        return;
    }

    try {
        if (await argon2.verify(user.password, password)) {
            user.last_login_at = new Date();
            await user.save();
            logger.info(`${username} logged in successfully`);
            response.data = jwt.sign({username: username, token_key: user.token_key}, config.secret, {expiresIn: '3h'});
        } else {
            const newErr = new Error('Authentication failed: Wrong password');
            newErr.status = 401;
            next(newErr);
            logger.info(`Failed to authenticate ${username}: Wrong password`);
            return;
        }
    } catch (err) {
        err.status = 500;
        next(err);
        logger.error(`Failed to verify argon2 password ${user.password}`);
        return;
    }
    res.status(200).send(response);
};

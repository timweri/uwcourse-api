const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require(`${approot}/config/config`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const response = {};

        if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
            return next(errorBuilder('Missing username and/or password', 400));
        }

        const password = req.body.password;
        const username = req.body.username.toLowerCase();

        const user = await User.findOne({username}, ['password', 'token_key']);

        if (!user) {
            logger.info(`User (${username}) not found`);
            return next(errorBuilder('User not found', 400));
        }

        if (await argon2.verify(user.password, password)) {
            user.last_login_at = new Date();
            await user.save();
            response.data = jwt.sign({
                username: username,
                token_key: user.token_key,
            }, config.secret, {expiresIn: '3h'});
        } else {
            logger.info(`Failed to authenticate ${username}: Wrong password`);
            return next(errorBuilder('Authentication failed: Wrong password', 401));
        }

        logger.info(`${username} logged in successfully`);
        res.status(200)
            .send(response);
    } catch (err) {
        logger.error('Failed to verify argon2 password');
        return next(err);
    }
};

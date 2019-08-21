const approot = require('app-root-path');
const config = require(`${approot}/config/config`);
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const response = {};

        if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
            return next(buildErrorResponse('MISSING_USERNAME_OR_PASSWORD', 400));
        }

        const password = req.body.password;
        const username = req.body.username.toLowerCase();

        const user = await User.findOne({username});
        if (!user) {
            return next(buildErrorResponse('USER_NOT_FOUND', 404));
        }

        if (await argon2.verify(user.password, password)) {
            user.last_login_at = new Date();
            await user.save();
            response.data = jwt.sign({
                username: username,
                token_key: user.token_key,
            }, config.secret, {expiresIn: config.jwt.expiry});
        } else {
            return next(buildErrorResponse('WRONG_USERNAME_PASSWORD', 401));
        }

        logger.info('Returning 200');
        res.status(200)
            .send(response);
    } catch (err) {
        next(err);
    }
};

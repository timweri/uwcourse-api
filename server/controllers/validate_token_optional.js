const approot = require('app-root-path');
const config = require(`${approot}/config/config`);
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const jwt = require('jsonwebtoken');
const User = require(`${approot}/models/User`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);
        const token = req.header(config.app.auth_header);
        if (!token) {
            return next();
        }

        const decodedToken = jwt.verify(token, config.secret);
        if (!decodedToken.hasOwnProperty('username') || !decodedToken.hasOwnProperty('token_key')) {
            return next(buildErrorResponse('INVALID_TOKEN', 401));
        }
        decodedToken.username = decodedToken.username.toLowerCase();

        const user = await User.findOne({
            username: decodedToken.username,
        });
        if (!user) {
            return next(buildErrorResponse('USER_NOT_FOUND', 404));
        }
        if (user.token_key !== decodedToken.token_key) {
            return next(buildErrorResponse('INVALID_TOKEN', 401));
        }

        req.token = {
            raw: token,
            user,
        };
        next();
    } catch (err) {
        if ((err.name === 'JsonWebTokenError' && err.message === 'invalid signature') ||
            (err.name === 'JsonWebTokenError' && err.message === 'invalid token') ||
            (err.name === 'TokenExpiredError' && err.message === 'jwt expired')) {
            return next(buildErrorResponse('INVALID_TOKEN', 401));
        }
        next(err);
    }
};

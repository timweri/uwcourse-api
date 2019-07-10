const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const jwt = require('jsonwebtoken');
const User = require(`${approot}/models/User`);
const config = require(`${approot}/config/config`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const token = req.header(config.app.auth_header);
        if (!token) {
            logger.info('Missing token');
            return next(errorBuilder(null, 401));
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, config.secret);
            if (!decodedToken.hasOwnProperty('username') || !decodedToken.hasOwnProperty('token_key')) {
                return next(errorBuilder(`Invalid token ${token}`));
            }
            decodedToken.username = decodedToken.username.toLowerCase();
            logger.info(`Valid token: ${token}`);
        } catch (err) {
            if ((err.name === 'JsonWebTokenError' && err.message === 'invalid signature') ||
                (err.name === 'TokenExpiredError' && err.message === 'jwt expired')) {
                logger.info(`Invalid token: ${token}`);
                return next(errorBuilder(null, 401));
            } else {
                return next(err);
            }
        }

        const user = await User.findOne({
            username: decodedToken.username,
            token_key: decodedToken.token_key,
        });

        if (!user) {
            logger.info(`Invalid token key: ${token}`);
            return next(errorBuilder(null, 401));
        }
        logger.info(`Valid token key: ${token}`);

        req.token = {
            raw: token,
            username: decodedToken.username,
        };
        next();
    } catch (err) {
        return next(err);
    }
};

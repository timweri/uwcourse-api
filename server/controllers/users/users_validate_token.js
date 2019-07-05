const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const jwt = require('jsonwebtoken');
const User = require(`${approot}/models/User`);
const config = require(`${approot}/config/config`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const token = req.header(config.app.auth_header);
    if (!token) {
        const newErr = new Error();
        newErr.status = 401;
        next(newErr);
        logger.info('Missing token');
        return;
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, config.secret);
        if (!decodedToken.hasOwnProperty('username') || !decodedToken.hasOwnProperty('token_key')) {
            return next(new Error(`Invalid token ${token}`));
        }
        decodedToken.username = decodedToken.username.toLowerCase();
        logger.info(`Valid token: ${token}`);
    } catch (err) {
        if ((err.name === 'JsonWebTokenError' && err.message === 'invalid signature') ||
            (err.name === 'TokenExpiredError' && err.message === 'jwt expired')) {
            const newErr = new Error();
            newErr.status = 401;
            next(newErr);
            logger.info(`Invalid token: ${token}`);
            return;
        } else {
            return next(err);
        }
    }

    let user;
    try {
        user = await User.findOne({
            username: decodedToken.username,
            token_key: decodedToken.token_key,
        });
    } catch (err) {
        return next(err);
    }

    if (!user) {
        const newErr = new Error();
        newErr.status = 401;
        next(newErr);
        logger.info(`Invalid token key: ${token}`);
        return;
    }
    logger.info(`Valid token key: ${token}`);

    req.token = {
        raw: token,
        username: decodedToken.username,
    };
    next();
};

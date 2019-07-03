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
        logger.info(`Valid token: ${token}`);
    } catch (err) {
        if ((err.name === 'JsonWebTokenError' && err.message === 'invalid signature') ||
            (err.name === 'TokenExpiredError' && err.message === 'jwt expired')) {
            const newErr = new Error();
            newErr.status = 401;
            next(newErr);
            logger.info(`Invalid token: ${token}`);
        } else {
            next(err);
        }
        return;
    }

    let user;
    try {
        user = await User.findOne({
            email: decodedToken.email,
            token_key: decodedToken.token_key,
        });
    } catch (err) {
        next(err);
        return;
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
        email: decodedToken.email,
    };
    next();
};

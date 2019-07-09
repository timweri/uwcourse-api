const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const username = req.token.username;

    let user;
    try {
        user = await User.findOne({username});
    } catch (err) {
        return next(err);
    }

    if (!user) {
        const newErr = new Error('User not found');
        newErr.status = 404;
        next(newErr);
        logger.info(`User ${username} not found`);
        return;
    }

    req.user = user;
    next();
};

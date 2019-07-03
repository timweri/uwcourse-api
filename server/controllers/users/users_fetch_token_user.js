const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const email = req.token.email;

    let user;
    try {
        user = await User.findOne({email});
    } catch (err) {
        return next(err);
    }

    if (!user) {
        const newErr = new Error('User not found');
        newErr.status = 404;
        next(newErr);
        logger.info(`User ${email} not found`);
        return;
    }

    req.user = user;
    next();
};

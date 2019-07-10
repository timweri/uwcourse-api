const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const username = req.token.username;

        const user = await User.findOne({username});

        if (!user) {
            logger.info(`User ${username} not found`);
            return next(errorBuilder('User not found', 404));
        }

        req.user = user;
        return next();
    } catch (err) {
        return next(err);
    }
};

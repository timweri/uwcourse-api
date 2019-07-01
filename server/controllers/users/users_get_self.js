const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const result = {};

    const email = req.token.email;

    logger.info(`Received GET request to fetch ${email}'s profile`);

    let user;
    try {
        user = await User.findOne({
            email,
        });
    } catch (err) {
        next(err);
        logger.info(`GET request for ${email} failed`);
        return;
    }

    if (user) {
        result.status = 200;
        result.data = {
            _id: user._id,
            name: user.name,
            email,
            avatar_url: user.avatar_url,
            favourite_courses: user.favourite_courses,
            terms: user.terms,
            updated_at: user.updated_at,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        };
    } else {
        const newErr = new Error('User not found');
        newErr.status = 404;
        next(newErr);
        logger.info(`GET request for ${email} failed`);
        return;
    }

    res.status(result.status).send(result);
    logger.info(`GET request for ${email} succeeded`);
};
